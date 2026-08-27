import { prisma } from "@/lib/prisma";
import { recordCoinMovement } from "@/lib/coin-ledger-service";
import { createNotification } from "@/lib/notification-service";

export interface ProcessSurveyRewardParams {
  missionId: string;
  workerUserId: string;
  evidenceId: string;
  rewardCents: number;
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

  // 2. Budget Check
  const effectiveReward = mission.rewardPerValidSubmissionCents || rewardCents || 1000;
  const remaining = mission.remainingBudgetCents ?? 0;
  if (remaining < effectiveReward) {
    return { success: false, reason: "BUDGET_EXHAUSTED" };
  }

  const idempotencyKey = `survey-reward-${missionId}-${evidenceId}`;

  // 3. Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    // Re-verify budget atomically inside transaction
    const freshM = await tx.mission.findUnique({
      where: { id: missionId },
      select: { remainingBudgetCents: true, status: true },
    });

    if (!freshM || (freshM.remainingBudgetCents ?? 0) < effectiveReward) {
      return { success: false, reason: "BUDGET_EXHAUSTED" as const };
    }

    // Record CoinLedger & CoinTransaction for Worker
    const coinResult = await recordCoinMovement(tx, {
      userId: workerUserId,
      missionId,
      type: "MISSION_REWARD_RELEASE",
      amountCents: effectiveReward,
      description: `Survey Reward for mission: ${mission.title}`,
      idempotencyKey,
    });

    if (coinResult.alreadyProcessed) {
      return { success: true, alreadyProcessed: true, rewardCents: effectiveReward };
    }

    // Decrement remaining budget
    const newRemaining = (freshM.remainingBudgetCents ?? 0) - effectiveReward;
    const isBudgetExhausted = newRemaining < effectiveReward;

    await tx.mission.update({
      where: { id: missionId },
      data: {
        remainingBudgetCents: newRemaining,
        ...(isBudgetExhausted ? { status: "REWARDED" } : { status: "IN_PROGRESS" }),
      },
    });

    // Record Timeline Entry
    await tx.timelineEntry.create({
      data: {
        missionId,
        eventType: "SURVEY_REWARD_PAID",
        summary: `Survey reward paid to worker ($${Math.round(effectiveReward / 100)}). Remaining budget: $${Math.round(newRemaining / 100)}.`,
        actorId: workerUserId,
      },
    });

    return {
      success: true,
      alreadyProcessed: false,
      rewardCents: effectiveReward,
      remainingBudgetCents: newRemaining,
      isBudgetExhausted,
    };
  });

  // 4. Send Notification after DB Transaction succeeds
  if (result.success && !result.alreadyProcessed) {
    await createNotification({
      userId: workerUserId,
      type: "REWARD_PAID",
      title: "Survey Reward Received",
      body: `🎉 Evidence hợp lệ! Bạn đã nhận được ${Math.round(effectiveReward / 100)} coin.`,
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
      // Refund remaining unspent escrow to Requester
      await recordCoinMovement(tx, {
        userId: mission.requesterId,
        missionId: mission.id,
        type: "MISSION_REFUND",
        amountCents: remaining,
        description: `Unspent Survey Escrow refund for expired mission: ${mission.title}`,
        idempotencyKey: `survey-refund-${mission.id}`,
      });
    }

    const finalStatus = remaining < (mission.remainingBudgetCents ?? 0) ? "REWARDED" : "REFUNDED";

    const updated = await tx.mission.update({
      where: { id: missionId },
      data: {
        remainingBudgetCents: 0,
        status: finalStatus,
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
