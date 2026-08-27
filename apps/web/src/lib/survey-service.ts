import { prisma } from "@/lib/prisma";
import { recordCoinMovement } from "@/lib/coin-ledger-service";
import { createNotification } from "@/lib/notification-service";

export interface ProcessSurveyRewardParams {
  missionId: string;
  workerUserId: string;
  evidenceId: string;
  rewardCents: number;
}

export async function getSurveyStats(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      maxParticipants: true,
      rewardBudgetCents: true,
      remainingBudgetCents: true,
      rewardPerValidSubmissionCents: true,
      selectionMode: true,
      disputeMode: true,
      logVisibility: true,
    },
  });

  if (!mission) return null;

  const selectedCount = await prisma.surveyParticipant.count({
    where: {
      missionId,
      status: { in: ["SELECTED", "REWARDED"] },
    },
  });

  const pendingReviewCount = await prisma.surveyParticipant.count({
    where: {
      missionId,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
  });

  const maxSlots = mission.maxParticipants || 999999;
  const remainingSlots = Math.max(0, maxSlots - selectedCount);

  return {
    selectedCount,
    pendingReviewCount,
    maxSlots,
    remainingSlots,
    selectionMode: mission.selectionMode,
    disputeMode: mission.disputeMode,
    logVisibility: mission.logVisibility,
    remainingBudgetCents: mission.remainingBudgetCents ?? 0,
    rewardPerValidSubmissionCents: mission.rewardPerValidSubmissionCents ?? 1000,
  };
}

export async function processSurveyReward(params: ProcessSurveyRewardParams) {
  const { missionId, workerUserId, evidenceId, rewardCents } = params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      expiresAt: true,
      rewardPerValidSubmissionCents: true,
      remainingBudgetCents: true,
      requesterId: true,
      selectionMode: true,
      disputeMode: true,
      maxParticipants: true,
    },
  });

  if (!mission || mission.category !== "SURVEY") {
    return { success: false, reason: "NOT_A_SURVEY_MISSION" };
  }

  // 1. Expiry Check (SERVER Time)
  const now = new Date();
  if (now > mission.expiresAt) {
    return { success: false, reason: "MISSION_EXPIRED" };
  }

  // If selectionMode === "REQUESTER_SELECT", record participant as UNDER_REVIEW and do NOT auto-reward
  if (mission.selectionMode === "REQUESTER_SELECT") {
    const participant = await prisma.surveyParticipant.upsert({
      where: { missionId_userId: { missionId, userId: workerUserId } },
      create: {
        missionId,
        userId: workerUserId,
        evidenceId,
        status: "UNDER_REVIEW",
      },
      update: {
        evidenceId,
        status: "UNDER_REVIEW",
      },
    });

    await createNotification({
      userId: mission.requesterId,
      type: "EVIDENCE_UPLOADED",
      title: "New Survey Evidence Submitted",
      body: `A participant submitted survey evidence for "${mission.title}" requiring your review.`,
      link: `/missions/${missionId}`,
      missionId,
    }).catch(() => {});

    return {
      success: true,
      status: "UNDER_REVIEW",
      message: "Evidence đang chờ người giao xét duyệt.",
      participant,
    };
  }

  // --- AUTO MODE ---
  const effectiveReward = mission.rewardPerValidSubmissionCents || rewardCents || 1000;
  const remaining = mission.remainingBudgetCents ?? 0;
  if (remaining < effectiveReward) {
    return { success: false, reason: "BUDGET_EXHAUSTED" };
  }

  // Check slots limit
  if (mission.maxParticipants) {
    const selectedCount = await prisma.surveyParticipant.count({
      where: { missionId, status: { in: ["SELECTED", "REWARDED"] } },
    });
    if (selectedCount >= mission.maxParticipants) {
      return { success: false, reason: "SURVEY_FULL" };
    }
  }

  const idempotencyKey = `SURVEY_REWARD:${missionId}:${workerUserId}`;

  // 3. Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    const freshM = await tx.mission.findUnique({
      where: { id: missionId },
      select: { remainingBudgetCents: true, status: true, maxParticipants: true },
    });

    if (!freshM || (freshM.remainingBudgetCents ?? 0) < effectiveReward) {
      return { success: false, reason: "BUDGET_EXHAUSTED" as const };
    }

    if (freshM.maxParticipants) {
      const currentSelected = await tx.surveyParticipant.count({
        where: { missionId, status: { in: ["SELECTED", "REWARDED"] } },
      });
      if (currentSelected >= freshM.maxParticipants) {
        return { success: false, reason: "SURVEY_FULL" as const };
      }
    }

    const isDisputeEnabled = mission.disputeMode === "ENABLED";
    const initialParticipantStatus = isDisputeEnabled ? "SELECTED" : "REWARDED";

    const participant = await tx.surveyParticipant.upsert({
      where: { missionId_userId: { missionId, userId: workerUserId } },
      create: {
        missionId,
        userId: workerUserId,
        evidenceId,
        status: initialParticipantStatus,
        selectedAt: now,
        ...(isDisputeEnabled ? {} : { rewardedAt: now }),
      },
      update: {
        evidenceId,
        status: initialParticipantStatus,
        selectedAt: now,
        ...(isDisputeEnabled ? {} : { rewardedAt: now }),
      },
    });

    let coinResult = { alreadyProcessed: false };

    // If disputeMode === "DISABLED": reward immediately inside transaction
    if (!isDisputeEnabled) {
      coinResult = await recordCoinMovement(tx, {
        userId: workerUserId,
        missionId,
        type: "MISSION_REWARD_RELEASE",
        amountCents: effectiveReward,
        description: `Survey Auto-Reward for mission: ${mission.title}`,
        idempotencyKey,
      });
    }

    if (coinResult.alreadyProcessed) {
      return { success: true, alreadyProcessed: true, rewardCents: effectiveReward };
    }

    const newRemaining = (freshM.remainingBudgetCents ?? 0) - effectiveReward;
    const isBudgetExhausted = newRemaining < effectiveReward;

    await tx.mission.update({
      where: { id: missionId },
      data: {
        remainingBudgetCents: newRemaining,
        ...(isDisputeEnabled
          ? { status: "COMPLETED_PENDING_SETTLEMENT", settlementStartedAt: now }
          : isBudgetExhausted
            ? { status: "REWARDED" }
            : { status: "IN_PROGRESS" }),
      },
    });

    await tx.timelineEntry.create({
      data: {
        missionId,
        eventType: isDisputeEnabled ? "SURVEY_PARTICIPANT_SELECTED" : "SURVEY_REWARD_PAID",
        summary: isDisputeEnabled
          ? `Worker selected. 24h settlement countdown started.`
          : `Survey auto-reward paid to worker ($${Math.round(effectiveReward / 100)}).`,
        actorId: workerUserId,
      },
    });

    return {
      success: true,
      alreadyProcessed: false,
      rewardCents: effectiveReward,
      remainingBudgetCents: newRemaining,
      isBudgetExhausted,
      participant,
      disputeMode: mission.disputeMode,
    };
  });

  if (result.success && !result.alreadyProcessed) {
    await createNotification({
      userId: workerUserId,
      type: "REWARD_PAID",
      title:
        mission.disputeMode === "ENABLED"
          ? "Survey Selected (24h Settlement)"
          : "Survey Reward Received",
      body:
        mission.disputeMode === "ENABLED"
          ? "Bạn sẽ trở thành người chiến thắng trong vòng 24h không có khiếu nại"
          : `🏆 Bạn đã được chọn và nhận ${Math.round(effectiveReward / 100)} coin.`,
      link: `/missions/${missionId}`,
      missionId,
    }).catch(() => {});
  }

  return result;
}

export async function selectSurveyParticipant(
  missionId: string,
  targetWorkerUserId: string,
  requesterUserId: string,
  action: "SELECT" | "REJECT",
) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      expiresAt: true,
      rewardPerValidSubmissionCents: true,
      remainingBudgetCents: true,
      requesterId: true,
      disputeMode: true,
      maxParticipants: true,
    },
  });

  if (!mission || mission.category !== "SURVEY") {
    throw new Error("Mission not found or is not a SURVEY mission");
  }

  if (mission.requesterId !== requesterUserId) {
    throw new Error("Only the mission requester can select survey participants");
  }

  const now = new Date();
  if (now > mission.expiresAt) {
    throw new Error("Mission has expired. Cannot select new participants.");
  }

  const participant = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: targetWorkerUserId } },
  });

  if (!participant) {
    throw new Error("Participant record not found for this mission");
  }

  if (participant.status === "SELECTED" || participant.status === "REWARDED") {
    return { success: true, message: "Participant is already selected/rewarded", participant };
  }

  if (action === "REJECT") {
    const updated = await prisma.surveyParticipant.update({
      where: { id: participant.id },
      data: { status: "REJECTED" },
    });

    await createNotification({
      userId: targetWorkerUserId,
      type: "REJECTED",
      title: "Survey Selection Result",
      body: `Bạn chưa được chọn cho khảo sát "${mission.title}".`,
      link: `/missions/${missionId}`,
      missionId,
    }).catch(() => {});

    return { success: true, action: "REJECT", participant: updated };
  }

  // --- SELECT ACTION ---
  const effectiveReward = mission.rewardPerValidSubmissionCents || 1000;
  const remaining = mission.remainingBudgetCents ?? 0;
  if (remaining < effectiveReward) {
    throw new Error("INSUFFICIENT_BUDGET: Mission reward budget is exhausted");
  }

  const idempotencyKey = `SURVEY_REWARD:${missionId}:${targetWorkerUserId}`;

  const result = await prisma.$transaction(async (tx) => {
    const freshM = await tx.mission.findUnique({
      where: { id: missionId },
      select: { remainingBudgetCents: true, maxParticipants: true },
    });

    if (!freshM || (freshM.remainingBudgetCents ?? 0) < effectiveReward) {
      throw new Error("INSUFFICIENT_BUDGET: Mission reward budget is exhausted");
    }

    if (freshM.maxParticipants) {
      const selectedCount = await tx.surveyParticipant.count({
        where: { missionId, status: { in: ["SELECTED", "REWARDED"] } },
      });
      if (selectedCount >= freshM.maxParticipants) {
        throw new Error("SURVEY_FULL: All survey slots have been filled");
      }
    }

    const isDisputeEnabled = mission.disputeMode === "ENABLED";
    const nextStatus = isDisputeEnabled ? "SELECTED" : "REWARDED";

    const updatedParticipant = await tx.surveyParticipant.update({
      where: { id: participant.id },
      data: {
        status: nextStatus,
        selectedAt: now,
        ...(isDisputeEnabled ? {} : { rewardedAt: now }),
      },
    });

    let coinResult = { alreadyProcessed: false };
    if (!isDisputeEnabled) {
      coinResult = await recordCoinMovement(tx, {
        userId: targetWorkerUserId,
        missionId,
        type: "MISSION_REWARD_RELEASE",
        amountCents: effectiveReward,
        description: `Survey Selection Reward for mission: ${mission.title}`,
        idempotencyKey,
      });
    }

    const newRemaining = (freshM.remainingBudgetCents ?? 0) - effectiveReward;

    await tx.mission.update({
      where: { id: missionId },
      data: {
        remainingBudgetCents: newRemaining,
        ...(isDisputeEnabled
          ? { status: "COMPLETED_PENDING_SETTLEMENT", settlementStartedAt: now }
          : {}),
      },
    });

    await tx.timelineEntry.create({
      data: {
        missionId,
        eventType: "SURVEY_PARTICIPANT_SELECTED",
        summary: `Requester selected worker ${targetWorkerUserId}. ${isDisputeEnabled ? "24h settlement started." : "Reward released."}`,
        actorId: requesterUserId,
      },
    });

    return {
      success: true,
      participant: updatedParticipant,
      disputeMode: mission.disputeMode,
      alreadyProcessed: coinResult.alreadyProcessed,
    };
  });

  if (result.success) {
    await createNotification({
      userId: targetWorkerUserId,
      type: "APPROVED",
      title: "Survey Participant Selected!",
      body:
        mission.disputeMode === "ENABLED"
          ? "Bạn sẽ trở thành người chiến thắng trong vòng 24h không có khiếu nại"
          : `🏆 Bạn đã được chọn và nhận ${Math.round(effectiveReward / 100)} coin.`,
      link: `/missions/${missionId}`,
      missionId,
    }).catch(() => {});
  }

  return result;
}

export async function expireSurveyMission(missionId: string) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const mission = await tx.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        expiresAt: true,
        remainingBudgetCents: true,
        requesterId: true,
      },
    });

    if (!mission || mission.category !== "SURVEY") return null;

    const remaining = mission.remainingBudgetCents ?? 0;
    if (remaining > 0) {
      await recordCoinMovement(tx, {
        userId: mission.requesterId,
        missionId: mission.id,
        type: "MISSION_REFUND",
        amountCents: remaining,
        description: `Unspent Survey Escrow refund for expired mission: ${mission.title}`,
        idempotencyKey: `survey-refund-${mission.id}`,
      });
    }

    const updated = await tx.mission.update({
      where: { id: missionId },
      data: {
        remainingBudgetCents: 0,
        status: "REFUNDED",
      },
    });

    await tx.timelineEntry.create({
      data: {
        missionId,
        eventType: "SURVEY_EXPIRED",
        summary: `Survey mission expired. Remaining unspent escrow ($${Math.round(remaining / 100)}) refunded to requester.`,
        actorId: mission.requesterId,
      },
    });

    return updated;
  });
}
