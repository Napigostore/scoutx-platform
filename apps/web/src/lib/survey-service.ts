import { prisma } from "@/lib/prisma";
import { recordCoinMovement } from "@/lib/coin-ledger-service";
import { createNotification } from "@/lib/notification-service";
import { getWorkerTrustProfile, recalculateWorkerTrust } from "@/lib/worker-trust-service";

export interface ProcessSurveyRewardParams {
  missionId: string;
  workerUserId: string;
  evidenceId: string;
  rewardCents: number;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMBER" | "TEXT" | "YES_NO";
  options?: string[];
  eligibleAnswers?: unknown[];
  required?: boolean;
  order?: number;
}

export interface QuotaRule {
  dimension: "country" | "ageRange" | "gender" | string;
  value: string;
  target: number;
}

export function computeAgeRange(birthDate?: Date | string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age >= 18 && age <= 24) return "18-24";
  if (age >= 25 && age <= 34) return "25-34";
  if (age >= 35 && age <= 44) return "35-44";
  if (age >= 45) return "45+";
  return "UNDER_18";
}

export function evaluateScreeningAnswers(
  questions: ScreeningQuestion[],
  answers: Record<string, unknown>,
): { eligible: boolean; failedQuestions: string[] } {
  const failedQuestions: string[] = [];

  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (q.required && (userAnswer === undefined || userAnswer === null || userAnswer === "")) {
      failedQuestions.push(q.id);
      continue;
    }

    if (q.eligibleAnswers && Array.isArray(q.eligibleAnswers) && q.eligibleAnswers.length > 0) {
      if (q.type === "MULTIPLE_CHOICE") {
        const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const match = userArr.some((val: unknown) => q.eligibleAnswers!.includes(val));
        if (!match) failedQuestions.push(q.id);
      } else {
        if (!q.eligibleAnswers.includes(userAnswer)) {
          failedQuestions.push(q.id);
        }
      }
    }
  }

  return {
    eligible: failedQuestions.length === 0,
    failedQuestions,
  };
}

export async function getSurveyQuotaStats(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      maxParticipants: true,
      quotas: true,
      screeningEnabled: true,
    },
  });

  if (!mission) return null;

  const selectedParticipants = await prisma.surveyParticipant.findMany({
    where: {
      missionId,
      status: { in: ["SELECTED", "REWARDED"] },
    },
    select: {
      profileSnapshot: true,
    },
  });

  const totalSelected = selectedParticipants.length;
  const maxSlots = mission.maxParticipants || 999999;
  const remainingTotalSlots = Math.max(0, maxSlots - totalSelected);

  const rawQuotas = (mission.quotas as QuotaRule[] | null) || [];
  const quotaStats = rawQuotas.map((q) => {
    let count = 0;
    selectedParticipants.forEach((p) => {
      const snap = (p.profileSnapshot as Record<string, unknown> | null) || {};
      if (snap[q.dimension] === q.value) {
        count++;
      }
    });

    const remaining = Math.max(0, q.target - count);
    const percentFilled = q.target > 0 ? (count / q.target) * 100 : 100;
    const isNearFull = remaining <= Math.max(1, Math.ceil(q.target * 0.1));
    const isFull = count >= q.target;

    return {
      dimension: q.dimension,
      value: q.value,
      target: q.target,
      count,
      remaining,
      percentFilled,
      isNearFull,
      isFull,
    };
  });

  return {
    totalSelected,
    maxSlots,
    remainingTotalSlots,
    screeningEnabled: mission.screeningEnabled,
    quotaStats,
  };
}

export async function processSurveyScreening(
  missionId: string,
  workerUserId: string,
  answers: Record<string, unknown>,
) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      category: true,
      screeningEnabled: true,
      screeningQuestions: true,
      quotas: true,
      minimumTrustScore: true,
      minimumQualityScore: true,
      minimumCompletedMissions: true,
      verifiedOnly: true,
      expiresAt: true,
    },
  });

  if (!mission || mission.category !== "SURVEY") {
    throw new Error("Mission not found or is not a SURVEY mission");
  }

  if (new Date() > mission.expiresAt) {
    throw new Error("Mission has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: { country: true, gender: true, birthDate: true },
  });

  if (!user) throw new Error("Worker profile not found");

  // Trust & Quality Targeting Checks
  const trustProfile = await getWorkerTrustProfile(workerUserId);
  if (trustProfile) {
    if (mission.minimumTrustScore && trustProfile.trustScore < mission.minimumTrustScore) {
      return {
        eligible: false,
        targetingNotMet: true,
        error: `TARGETING_NOT_MET: Minimum Trust Score requirement not met (${trustProfile.trustScore}/${mission.minimumTrustScore})`,
      };
    }
    if (mission.minimumQualityScore && trustProfile.qualityScore < mission.minimumQualityScore) {
      return {
        eligible: false,
        targetingNotMet: true,
        error: `TARGETING_NOT_MET: Minimum Quality Score requirement not met (${trustProfile.qualityScore}/${mission.minimumQualityScore})`,
      };
    }
    if (
      mission.minimumCompletedMissions &&
      trustProfile.completedMissions < mission.minimumCompletedMissions
    ) {
      return {
        eligible: false,
        targetingNotMet: true,
        error: `TARGETING_NOT_MET: Minimum Completed Missions requirement not met (${trustProfile.completedMissions}/${mission.minimumCompletedMissions})`,
      };
    }
    if (mission.verifiedOnly && !trustProfile.profileVerified) {
      return {
        eligible: false,
        targetingNotMet: true,
        error: "TARGETING_NOT_MET: Verified workers only requirement not met",
      };
    }
  }

  const ageRange = computeAgeRange(user.birthDate);
  const profileSnapshot = {
    country: user.country,
    gender: user.gender,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    ageRange,
  };

  // Anti-Abuse Check: If participant already screened out, return existing state
  const existing = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerUserId } },
  });

  if (existing && existing.screeningStatus === "SCREENED_OUT") {
    return {
      eligible: false,
      screeningStatus: "SCREENED_OUT",
      message: "Bạn không thuộc nhóm đối tượng của khảo sát này.",
      participant: existing,
    };
  }

  // Quota validation: Check if required profile attributes exist
  const quotasList = (mission.quotas as QuotaRule[] | null) || [];
  for (const q of quotasList) {
    if (q.dimension === "country" && !user.country) {
      return {
        eligible: false,
        profileIncomplete: true,
        missingAttribute: "country",
        error:
          "PROFILE_INCOMPLETE: Vui lòng bổ sung quốc gia trong hồ sơ trước khi tham gia khảo sát.",
      };
    }
    if (q.dimension === "gender" && !user.gender) {
      return {
        eligible: false,
        profileIncomplete: true,
        missingAttribute: "gender",
        error:
          "PROFILE_INCOMPLETE: Vui lòng bổ sung giới tính trong hồ sơ trước khi tham gia khảo sát.",
      };
    }
    if (q.dimension === "ageRange" && !user.birthDate) {
      return {
        eligible: false,
        profileIncomplete: true,
        missingAttribute: "birthDate",
        error:
          "PROFILE_INCOMPLETE: Vui lòng bổ sung ngày sinh trong hồ sơ trước khi tham gia khảo sát.",
      };
    }
  }

  // Evaluate Screening Answers
  let isEligible = true;
  if (mission.screeningEnabled && mission.screeningQuestions) {
    const questions = (mission.screeningQuestions as unknown as ScreeningQuestion[]) || [];
    const evaluation = evaluateScreeningAnswers(questions, answers);
    isEligible = evaluation.eligible;
  }

  const finalScreeningStatus = isEligible ? "ELIGIBLE" : "SCREENED_OUT";

  const participant = await prisma.surveyParticipant.upsert({
    where: { missionId_userId: { missionId, userId: workerUserId } },
    create: {
      missionId,
      userId: workerUserId,
      status: "SUBMITTED",
      screeningStatus: finalScreeningStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screeningAnswers: answers as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profileSnapshot: profileSnapshot as any,
    },
    update: {
      screeningStatus: finalScreeningStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screeningAnswers: answers as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profileSnapshot: profileSnapshot as any,
    },
  });

  if (!isEligible) {
    return {
      eligible: false,
      screeningStatus: "SCREENED_OUT",
      message: "Bạn không thuộc nhóm đối tượng của khảo sát này.",
      participant,
    };
  }

  return {
    eligible: true,
    screeningStatus: "ELIGIBLE",
    message: "Bạn đủ điều kiện tham gia khảo sát.",
    profileSnapshot,
    participant,
  };
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
      screeningEnabled: true,
      screeningQuestions: true,
      quotas: true,
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
    screeningEnabled: mission.screeningEnabled,
    screeningQuestions: mission.screeningQuestions,
    quotas: mission.quotas,
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
      quotas: true,
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

  const user = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: { country: true, gender: true, birthDate: true },
  });

  const ageRange = computeAgeRange(user?.birthDate);
  const profileSnapshot = {
    country: user?.country,
    gender: user?.gender,
    birthDate: user?.birthDate ? user.birthDate.toISOString() : null,
    ageRange,
  };

  // Quota validation: Check missing profile info if quota configured
  const quotasList = (mission.quotas as QuotaRule[] | null) || [];
  for (const q of quotasList) {
    if (q.dimension === "country" && !user?.country) {
      return { success: false, reason: "PROFILE_INCOMPLETE", missingAttribute: "country" };
    }
    if (q.dimension === "gender" && !user?.gender) {
      return { success: false, reason: "PROFILE_INCOMPLETE", missingAttribute: "gender" };
    }
    if (q.dimension === "ageRange" && !user?.birthDate) {
      return { success: false, reason: "PROFILE_INCOMPLETE", missingAttribute: "birthDate" };
    }
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
        profileSnapshot,
      },
      update: {
        evidenceId,
        status: "UNDER_REVIEW",
        profileSnapshot,
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

  const idempotencyKey = `SURVEY_REWARD:${missionId}:${workerUserId}`;

  // 3. Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    const freshM = await tx.mission.findUnique({
      where: { id: missionId },
      select: { remainingBudgetCents: true, status: true, maxParticipants: true, quotas: true },
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

    // Server-Side Atomic Quota Enforcement
    const currentSelectedParticipants = await tx.surveyParticipant.findMany({
      where: { missionId, status: { in: ["SELECTED", "REWARDED"] } },
      select: { profileSnapshot: true },
    });

    const activeQuotas = (freshM.quotas as QuotaRule[] | null) || [];
    for (const q of activeQuotas) {
      const workerVal = (profileSnapshot as Record<string, unknown>)[q.dimension];
      if (workerVal === q.value) {
        let count = 0;
        currentSelectedParticipants.forEach((p) => {
          const snap = (p.profileSnapshot as Record<string, unknown> | null) || {};
          if (snap[q.dimension] === q.value) count++;
        });
        if (count >= q.target) {
          return { success: false, reason: "QUOTA_FULL" as const, quota: q };
        }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profileSnapshot: profileSnapshot as any,
        selectedAt: now,
        ...(isDisputeEnabled ? {} : { rewardedAt: now }),
      },
      update: {
        evidenceId,
        status: initialParticipantStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profileSnapshot: profileSnapshot as any,
        selectedAt: now,
        ...(isDisputeEnabled ? {} : { rewardedAt: now }),
      },
    });

    let coinResult = { alreadyProcessed: false };
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
      quotas: true,
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
      select: { remainingBudgetCents: true, maxParticipants: true, quotas: true },
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

    // Atomic Quota Enforcement for Requester Selection
    const selectedParticipants = await tx.surveyParticipant.findMany({
      where: { missionId, status: { in: ["SELECTED", "REWARDED"] } },
      select: { profileSnapshot: true },
    });

    const targetSnap = (participant.profileSnapshot as Record<string, unknown> | null) || {};
    const activeQuotas = (freshM.quotas as QuotaRule[] | null) || [];
    for (const q of activeQuotas) {
      const targetVal = targetSnap[q.dimension];
      if (targetVal === q.value) {
        let count = 0;
        selectedParticipants.forEach((p) => {
          const snap = (p.profileSnapshot as Record<string, unknown> | null) || {};
          if (snap[q.dimension] === q.value) count++;
        });
        if (count >= q.target) {
          throw new Error(
            `QUOTA_FULL: Quota for ${q.dimension} (${q.value}) is full (${count}/${q.target})`,
          );
        }
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
