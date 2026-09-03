/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Survey Fieldwork Service — P7
 *
 * Manages the full lifecycle of a live research fieldwork:
 *   RECRUITING → ACTIVE → PAUSED ↔ ACTIVE → QUOTA_FILLED / EXPIRED / COMPLETED
 *
 * Atomic slot reservation, submission pipeline, auto-replacement,
 * quota enforcement, expiry, coin safety.
 *
 * AI cannot call any of these functions directly.
 * Coin is only paid on ACCEPTED — never on RESERVED / IN_PROGRESS / SUBMITTED.
 */
import { prisma } from "@/lib/prisma";
import { recordCoinMovement } from "@/lib/coin-ledger-service";
import { getWorkerTrustProfile, recalculateWorkerTrust } from "@/lib/worker-trust-service";
import { evaluateWorkerRisk } from "@/lib/worker-risk-service";
import { createNotification } from "@/lib/notification-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FieldworkStatus =
  "RECRUITING" | "ACTIVE" | "PAUSED" | "QUOTA_FILLED" | "EXPIRED" | "COMPLETED" | "CANCELLED";

export type ParticipantStatus =
  | "INVITED"
  | "ELIGIBLE"
  | "RESERVED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "QUALITY_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "DISQUALIFIED"
  | "ABANDONED"
  | "EXPIRED"
  | "PAID";

export type FieldworkEventType =
  | "MISSION_STARTED"
  | "WORKER_JOINED"
  | "SCREENED"
  | "SCREENING_REJECTED"
  | "SURVEY_STARTED"
  | "SURVEY_SUBMITTED"
  | "QUALITY_ACCEPTED"
  | "QUALITY_REJECTED"
  | "QUOTA_FILLED"
  | "WORKER_REWARDED"
  | "WORKER_DISQUALIFIED"
  | "MISSION_PAUSED"
  | "MISSION_RESUMED"
  | "MISSION_COMPLETED"
  | "MISSION_EXPIRED";

// ─── Event helpers ────────────────────────────────────────────────────────────

async function logEvent(
  tx: any,
  missionId: string,
  type: FieldworkEventType,
  opts?: { workerId?: string; metadata?: Record<string, unknown> },
) {
  await tx.fieldworkEvent.create({
    data: {
      missionId,
      workerId: opts?.workerId ?? null,
      type,
      metadata: opts?.metadata ?? null,
    },
  });
}

// ─── Initialise fieldwork when a mission goes OPEN (called after copilot launch or manual publish) ──

export async function initFieldwork(missionId: string): Promise<void> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      category: true,
      expiresAt: true,
      maxParticipants: true,
      rewardBudgetCents: true,
      status: true,
    },
  });
  if (!mission || mission.category !== "SURVEY") return;
  if (mission.status !== "OPEN") return;

  await prisma.surveyFieldwork.upsert({
    where: { missionId },
    create: {
      missionId,
      status: "RECRUITING",
      startedAt: new Date(),
      expiresAt: mission.expiresAt,
      targetCompletes: mission.maxParticipants ?? 100,
      remainingBudget: mission.rewardBudgetCents ?? 0,
    },
    update: {}, // idempotent
  });

  await prisma.fieldworkEvent.create({
    data: { missionId, type: "MISSION_STARTED" },
  });
}

// ─── Eligibility check + atomic slot reservation ─────────────────────────────

export async function reserveSlot(
  missionId: string,
  workerId: string,
): Promise<{ success: true; participantId: string } | { success: false; reason: string }> {
  // 1. Load fieldwork state
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw) return { success: false, reason: "FIELDWORK_NOT_FOUND" };
  if (fw.status === "PAUSED") return { success: false, reason: "FIELDWORK_PAUSED" };
  if (fw.status === "QUOTA_FILLED") return { success: false, reason: "QUOTA_FILLED" };
  if (!["RECRUITING", "ACTIVE"].includes(fw.status))
    return { success: false, reason: `FIELDWORK_${fw.status}` };
  if (fw.completedCount >= fw.targetCompletes) return { success: false, reason: "TARGET_REACHED" };
  if (new Date() > fw.expiresAt) return { success: false, reason: "EXPIRED" };

  // 2. Load mission + trust rules
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      category: true,
      maxParticipants: true,
      minimumTrustScore: true,
      minimumQualityScore: true,
      minimumCompletedMissions: true,
      verifiedOnly: true,
    },
  });
  if (!mission || mission.category !== "SURVEY") return { success: false, reason: "NOT_A_SURVEY" };

  // 3. P4 Trust check
  if (
    mission.minimumTrustScore != null ||
    mission.minimumQualityScore != null ||
    mission.minimumCompletedMissions != null ||
    mission.verifiedOnly
  ) {
    const trust = await getWorkerTrustProfile(workerId);
    if (mission.minimumTrustScore != null && (trust?.trustScore ?? 0) < mission.minimumTrustScore)
      return { success: false, reason: "MIN_TRUST_NOT_MET" };
    if (
      mission.minimumQualityScore != null &&
      (trust?.qualityScore ?? 0) < mission.minimumQualityScore
    )
      return { success: false, reason: "MIN_QUALITY_NOT_MET" };
    if (
      mission.minimumCompletedMissions != null &&
      (trust?.completedMissions ?? 0) < mission.minimumCompletedMissions
    )
      return { success: false, reason: "MIN_MISSIONS_NOT_MET" };
    if (mission.verifiedOnly && !trust?.profileVerified)
      return { success: false, reason: "VERIFIED_ONLY" };
  }

  // 4. Risk check
  const risk = await evaluateWorkerRisk(workerId).catch(() => null);
  if (risk && risk.riskLevel === "HIGH") return { success: false, reason: "HIGH_FRAUD_RISK" };

  // 5. Duplicate participation
  const existing = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerId } },
    select: { id: true, status: true },
  });
  if (existing) {
    if (
      ["ACCEPTED", "PAID", "SUBMITTED", "QUALITY_REVIEW", "IN_PROGRESS", "RESERVED"].includes(
        existing.status,
      )
    ) {
      return { success: false, reason: "ALREADY_PARTICIPATING" };
    }
    if (["DISQUALIFIED"].includes(existing.status)) {
      return { success: false, reason: "DISQUALIFIED" };
    }
  }

  // 6. Atomic slot reservation with optimistic lock on version
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-check fieldwork with optimistic lock
      const fwLocked = await tx.surveyFieldwork.findUnique({ where: { missionId } });
      if (!fwLocked || fwLocked.version !== fw.version) throw new Error("CONCURRENCY_CONFLICT");
      if (
        fwLocked.completedCount + fwLocked.reservedCount + fwLocked.inProgressCount >=
        fwLocked.targetCompletes
      ) {
        throw new Error("SURVEY_FULL");
      }

      // Create or re-activate participant
      const participant = existing
        ? await tx.surveyParticipant.update({
            where: { missionId_userId: { missionId, userId: workerId } },
            data: { status: "RESERVED", slotReservedAt: new Date(), updatedAt: new Date() },
          })
        : await tx.surveyParticipant.create({
            data: {
              missionId,
              userId: workerId,
              status: "RESERVED",
              slotReservedAt: new Date(),
            },
          });

      // Increment counters + bump version
      await tx.surveyFieldwork.update({
        where: { missionId, version: fw.version },
        data: {
          reservedCount: { increment: 1 },
          status: "ACTIVE",
          lastActivityAt: new Date(),
          version: { increment: 1 },
        },
      });

      await logEvent(tx, missionId, "WORKER_JOINED", {
        workerId,
        metadata: { participantId: participant.id },
      });

      return participant;
    });

    return { success: true, participantId: result.id };
  } catch (err: any) {
    if (err.message === "SURVEY_FULL") return { success: false, reason: "SURVEY_FULL" };
    if (err.message === "CONCURRENCY_CONFLICT") {
      // Retry once
      return reserveSlot(missionId, workerId);
    }
    throw err;
  }
}

// ─── Start survey (RESERVED → IN_PROGRESS) ────────────────────────────────────

export async function startSurvey(missionId: string, workerId: string) {
  const participant = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerId } },
  });
  if (!participant || participant.status !== "RESERVED") {
    throw new Error("No reserved slot found — cannot start survey");
  }

  await prisma.$transaction(async (tx) => {
    await tx.surveyParticipant.update({
      where: { missionId_userId: { missionId, userId: workerId } },
      data: { status: "IN_PROGRESS", startedAt: new Date(), updatedAt: new Date() },
    });
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        reservedCount: { decrement: 1 },
        inProgressCount: { increment: 1 },
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.surveySubmission.upsert({
      where: { missionId_participantId: { missionId, participantId: participant.id } },
      create: {
        missionId,
        participantId: participant.id,
        status: "STARTED",
        startedAt: new Date(),
      },
      update: { status: "STARTED", startedAt: new Date() },
    });
    await logEvent(tx, missionId, "SURVEY_STARTED", { workerId });
  });

  return { success: true };
}

// ─── Submit survey → quality pipeline → ACCEPTED / REJECTED ──────────────────

export async function submitSurvey(
  missionId: string,
  workerId: string,
  opts: { durationSeconds?: number; qualityScore?: number; completionCode?: string },
): Promise<{ status: "ACCEPTED" | "REJECTED"; rewardCents?: number; reason?: string }> {
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw) throw new Error("Fieldwork not found");

  const participant = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerId } },
  });
  if (!participant || !["IN_PROGRESS", "SUBMITTED"].includes(participant.status)) {
    throw new Error("Cannot submit: participant not IN_PROGRESS");
  }

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      rewardPerValidSubmissionCents: true,
      rewardBudgetCents: true,
      remainingBudgetCents: true,
      disputeMode: true,
    },
  });
  if (!mission) throw new Error("Mission not found");

  // ── Quality pipeline ──────────────────────────────────────────────────────
  const MIN_DURATION_SECS = 60; // guard: 1 min minimum
  if (opts.durationSeconds != null && opts.durationSeconds < MIN_DURATION_SECS) {
    await rejectParticipant(missionId, workerId, participant.id, "TOO_FAST", fw);
    return { status: "REJECTED", reason: "DURATION_TOO_SHORT" };
  }

  const qualityScore = opts.qualityScore ?? 100;
  const QUALITY_THRESHOLD = 60;
  if (qualityScore < QUALITY_THRESHOLD) {
    await rejectParticipant(missionId, workerId, participant.id, "LOW_QUALITY", fw);
    return { status: "REJECTED", reason: "LOW_QUALITY_SCORE" };
  }

  // ── Budget check ──────────────────────────────────────────────────────────
  const rewardCents = mission.rewardPerValidSubmissionCents ?? 2000;
  if (fw.remainingBudget < rewardCents) {
    await rejectParticipant(missionId, workerId, participant.id, "BUDGET_EXHAUSTED", fw);
    return { status: "REJECTED", reason: "BUDGET_EXHAUSTED" };
  }

  // ── Idempotent reward ─────────────────────────────────────────────────────
  const submission = await prisma.surveySubmission.findUnique({
    where: { missionId_participantId: { missionId, participantId: participant.id } },
  });
  const idempotencyKey = `SURVEY_REWARD:${missionId}:${workerId}:${submission?.id ?? participant.id}`;

  await prisma.$transaction(async (tx) => {
    // Mark submission
    await tx.surveySubmission.upsert({
      where: { missionId_participantId: { missionId, participantId: participant.id } },
      create: {
        missionId,
        participantId: participant.id,
        status: "COMPLETED",
        submittedAt: new Date(),
        completedAt: new Date(),
        durationSeconds: opts.durationSeconds ?? null,
        qualityScore,
        qualityStatus: "PASSED",
        completionCode: opts.completionCode ?? null,
      },
      update: {
        status: "COMPLETED",
        submittedAt: new Date(),
        completedAt: new Date(),
        durationSeconds: opts.durationSeconds ?? null,
        qualityScore,
        qualityStatus: "PASSED",
        completionCode: opts.completionCode ?? null,
      },
    });

    // Mark participant ACCEPTED
    await tx.surveyParticipant.update({
      where: { missionId_userId: { missionId, userId: workerId } },
      data: {
        status: "ACCEPTED",
        selectedAt: new Date(),
        qualityScore,
        updatedAt: new Date(),
      },
    });

    // Reward coin — only on ACCEPTED
    await recordCoinMovement(tx as any, {
      userId: workerId,
      missionId,
      type: "MISSION_REWARD_RELEASE",
      amountCents: rewardCents,
      description: `Survey reward for mission "${mission.title}"`,
      idempotencyKey,
    });

    // Update fieldwork counters
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        completedCount: { increment: 1 },
        inProgressCount: { decrement: 1 },
        remainingBudget: { decrement: rewardCents },
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Decrement mission remaining budget
    await tx.mission.update({
      where: { id: missionId },
      data: { remainingBudgetCents: { decrement: rewardCents } },
    });

    await logEvent(tx, missionId, "QUALITY_ACCEPTED", {
      workerId,
      metadata: { rewardCents, qualityScore },
    });
    await logEvent(tx, missionId, "WORKER_REWARDED", {
      workerId,
      metadata: { rewardCents },
    });
  });

  // Notify worker
  await createNotification({
    userId: workerId,
    type: "REWARD_PAID",
    title: "Khảo sát hoàn thành!",
    body: `Bạn đã hoàn thành khảo sát và nhận thưởng ${rewardCents} coins.`,
    missionId,
  }).catch(() => null);

  // Trust score update
  await recalculateWorkerTrust(workerId).catch(() => null);

  // Check if quota/target reached → auto-complete
  await checkFieldworkCompletion(missionId).catch(() => null);

  return { status: "ACCEPTED", rewardCents };
}

// ─── Reject a participant (release slot for replacement) ─────────────────────

async function rejectParticipant(
  missionId: string,
  workerId: string,
  participantId: string,
  reason: string,
  fw: any,
) {
  await prisma.$transaction(async (tx) => {
    await tx.surveyParticipant.update({
      where: { missionId_userId: { missionId, userId: workerId } },
      data: { status: "REJECTED", abandonedAt: new Date(), updatedAt: new Date() },
    });
    await tx.surveySubmission.updateMany({
      where: { missionId, participantId },
      data: { status: "REJECTED", qualityStatus: "FAILED", submittedAt: new Date() },
    });
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        inProgressCount: { decrement: 1 },
        qualityRejectedCount: { increment: 1 },
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await logEvent(tx, missionId, "QUALITY_REJECTED", {
      workerId,
      metadata: { reason },
    });
  });
}

// ─── Abandon / timeout a slot ─────────────────────────────────────────────────

export async function abandonSlot(missionId: string, workerId: string) {
  const participant = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerId } },
  });
  if (!participant) return;
  if (!["RESERVED", "IN_PROGRESS"].includes(participant.status)) return;

  const wasInProgress = participant.status === "IN_PROGRESS";

  await prisma.$transaction(async (tx) => {
    await tx.surveyParticipant.update({
      where: { missionId_userId: { missionId, userId: workerId } },
      data: { status: "ABANDONED", abandonedAt: new Date(), updatedAt: new Date() },
    });
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        ...(wasInProgress
          ? { inProgressCount: { decrement: 1 } }
          : { reservedCount: { decrement: 1 } }),
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await logEvent(tx, missionId, "WORKER_DISQUALIFIED", {
      workerId,
      metadata: { reason: "ABANDONED" },
    });
  });
}

// ─── Pause / Resume ───────────────────────────────────────────────────────────

export async function pauseFieldwork(missionId: string, requesterId: string) {
  await verifyRequesterOwns(missionId, requesterId);
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw) throw new Error("Fieldwork not found");
  if (fw.status !== "ACTIVE" && fw.status !== "RECRUITING")
    throw new Error("Fieldwork is not active");

  await prisma.$transaction(async (tx) => {
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        status: "PAUSED",
        pausedAt: new Date(),
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.mission.update({ where: { id: missionId }, data: { status: "IN_PROGRESS" } });
    await logEvent(tx, missionId, "MISSION_PAUSED");
  });
}

export async function resumeFieldwork(missionId: string, requesterId: string) {
  await verifyRequesterOwns(missionId, requesterId);
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw) throw new Error("Fieldwork not found");
  if (fw.status !== "PAUSED") throw new Error("Fieldwork is not paused");

  await prisma.$transaction(async (tx) => {
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        status: "ACTIVE",
        pausedAt: null,
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.mission.update({ where: { id: missionId }, data: { status: "OPEN" } });
    await logEvent(tx, missionId, "MISSION_RESUMED");
  });
}

// ─── Complete (explicit) ──────────────────────────────────────────────────────

export async function completeFieldwork(missionId: string, requesterId: string) {
  await verifyRequesterOwns(missionId, requesterId);
  await doCompleteFieldwork(missionId, "REQUESTER_CONFIRMED");
}

async function doCompleteFieldwork(missionId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.mission.update({
      where: { id: missionId },
      data: { status: "COMPLETED_PENDING_SETTLEMENT" },
    });
    await logEvent(tx, missionId, "MISSION_COMPLETED", { metadata: { reason } });
  });
}

// ─── Auto-check completion after each accept ─────────────────────────────────

async function checkFieldworkCompletion(missionId: string) {
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw || fw.status !== "ACTIVE") return;

  if (fw.completedCount >= fw.targetCompletes) {
    await doCompleteFieldwork(missionId, "TARGET_REACHED");
  }
}

// ─── Expiry cron (idempotent) ─────────────────────────────────────────────────

export async function expireFieldwork(missionId: string) {
  const fw = await prisma.surveyFieldwork.findUnique({ where: { missionId } });
  if (!fw) return;
  if (["COMPLETED", "EXPIRED", "CANCELLED"].includes(fw.status)) return;

  const now = new Date();
  if (now < fw.expiresAt) return;

  // Release all in-flight reservations
  await prisma.surveyParticipant.updateMany({
    where: { missionId, status: { in: ["RESERVED", "IN_PROGRESS"] } },
    data: { status: "EXPIRED", abandonedAt: now },
  });

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { requesterId: true, title: true, remainingBudgetCents: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.surveyFieldwork.update({
      where: { missionId },
      data: {
        status: "EXPIRED",
        completedAt: now,
        lastActivityAt: now,
        version: { increment: 1 },
      },
    });
    await tx.mission.update({
      where: { id: missionId },
      data: { status: "COMPLETED_PENDING_SETTLEMENT" },
    });

    // Refund unused budget
    if (mission && (mission.remainingBudgetCents ?? 0) > 0) {
      await recordCoinMovement(tx as any, {
        userId: mission.requesterId,
        missionId,
        type: "MISSION_REFUND",
        amountCents: mission.remainingBudgetCents!,
        description: `Refund for expired survey "${mission.title}"`,
        idempotencyKey: `EXPIRY_REFUND:${missionId}`,
      });
    }

    await logEvent(tx, missionId, "MISSION_EXPIRED");
  });

  // Notify requester
  if (mission) {
    await createNotification({
      userId: mission.requesterId,
      type: "COMPLETED",
      title: "Khảo sát đã hết hạn",
      body: `Khảo sát "${mission.title}" đã hết hạn và budget chưa sử dụng được hoàn lại.`,
      missionId,
    }).catch(() => null);
  }
}

export async function expireAllDueFieldworks() {
  const due = await prisma.surveyFieldwork.findMany({
    where: {
      status: { in: ["RECRUITING", "ACTIVE", "PAUSED"] },
      expiresAt: { lte: new Date() },
    },
    select: { missionId: true },
  });
  for (const { missionId } of due) {
    await expireFieldwork(missionId).catch(() => null);
  }
}

// ─── Stats / Dashboard ────────────────────────────────────────────────────────

export async function getFieldworkStats(missionId: string) {
  const [fw, mission, quotaCounts] = await Promise.all([
    prisma.surveyFieldwork.findUnique({ where: { missionId } }),
    prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        title: true,
        rewardBudgetCents: true,
        remainingBudgetCents: true,
        rewardPerValidSubmissionCents: true,
        maxParticipants: true,
        quotas: true,
        expiresAt: true,
      },
    }),
    prisma.surveyParticipant.groupBy({
      by: ["status"],
      where: { missionId },
      _count: { status: true },
    }),
  ]);

  if (!fw || !mission) throw new Error("Fieldwork not found");

  const statusMap: Record<string, number> = {};
  for (const row of quotaCounts) statusMap[row.status] = row._count.status;

  const rewardPerParticipant = mission.rewardPerValidSubmissionCents ?? 0;
  const totalBudget = mission.rewardBudgetCents ?? 0;
  const spentBudget = totalBudget - (mission.remainingBudgetCents ?? 0);

  return {
    fieldwork: fw,
    mission: {
      title: mission.title,
      expiresAt: mission.expiresAt,
      maxParticipants: mission.maxParticipants,
      rewardPerParticipant,
    },
    participants: {
      eligible: statusMap["ELIGIBLE"] ?? 0,
      reserved: statusMap["RESERVED"] ?? 0,
      inProgress: statusMap["IN_PROGRESS"] ?? 0,
      submitted: statusMap["SUBMITTED"] ?? 0,
      accepted: statusMap["ACCEPTED"] ?? 0,
      rejected: statusMap["REJECTED"] ?? 0,
      abandoned: statusMap["ABANDONED"] ?? 0,
      paid: statusMap["PAID"] ?? 0,
      total: fw.completedCount,
    },
    budget: {
      total: totalBudget,
      spent: spentBudget,
      remaining: mission.remainingBudgetCents ?? 0,
    },
    completion: {
      completed: fw.completedCount,
      target: fw.targetCompletes,
      percent:
        fw.targetCompletes > 0 ? Math.round((fw.completedCount / fw.targetCompletes) * 100) : 0,
    },
  };
}

export async function getFieldworkQuotas(missionId: string) {
  const [mission, participants] = await Promise.all([
    prisma.mission.findUnique({
      where: { id: missionId },
      select: { quotas: true, maxParticipants: true },
    }),
    prisma.surveyParticipant.findMany({
      where: { missionId, status: { in: ["ACCEPTED", "PAID"] } },
      select: { profileSnapshot: true },
    }),
  ]);

  if (!mission) throw new Error("Mission not found");
  const quotas = (mission.quotas as any[] | null) ?? [];
  const snaps = participants.map((p) => (p.profileSnapshot as Record<string, unknown>) ?? {});

  return quotas.map((q: any) => {
    const filled = snaps.filter((s) => s[q.dimension] === q.value).length;
    return {
      dimension: q.dimension,
      value: q.value,
      target: q.target,
      filled,
      remaining: Math.max(0, q.target - filled),
      percentFilled: q.target > 0 ? Math.round((filled / q.target) * 100) : 100,
      isFull: filled >= q.target,
    };
  });
}

export async function getFieldworkActivity(missionId: string, limit = 50) {
  return prisma.fieldworkEvent.findMany({
    where: { missionId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      metadata: true,
      createdAt: true,
      // workerId intentionally omitted from public activity feed — not PII-safe
    },
  });
}

// ─── Worker UI data ───────────────────────────────────────────────────────────

export async function getWorkerFieldworkView(missionId: string) {
  const [fw, mission, quotas] = await Promise.all([
    prisma.surveyFieldwork.findUnique({
      where: { missionId },
      select: {
        status: true,
        completedCount: true,
        targetCompletes: true,
        expiresAt: true,
        remainingBudget: true,
      },
    }),
    prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        rewardPerValidSubmissionCents: true,
        title: true,
      },
    }),
    getFieldworkQuotas(missionId).catch(() => []),
  ]);

  return {
    status: fw?.status ?? "UNKNOWN",
    completed: fw?.completedCount ?? 0,
    target: fw?.targetCompletes ?? 0,
    expiresAt: fw?.expiresAt,
    estimatedReward: mission?.rewardPerValidSubmissionCents ?? 0,
    title: mission?.title ?? "",
    quotas,
    canJoin: fw ? ["RECRUITING", "ACTIVE"].includes(fw.status) : false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function verifyRequesterOwns(missionId: string, requesterId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { requesterId: true },
  });
  if (!mission) throw new Error("Mission not found");
  const user = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return; // Admin bypasses
  if (mission.requesterId !== requesterId) throw new Error("Forbidden — not mission owner");
}
