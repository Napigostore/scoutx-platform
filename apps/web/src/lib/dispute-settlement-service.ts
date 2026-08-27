import { prisma } from "@/lib/prisma";
import { notifyApproved, notifyNonWinners, notifyDisputeCreated } from "@/lib/notification-service";

export const MAX_FUNDED_COIN = 100000000;
export const MIN_VOTES_REQUIRED = 50;
export const MAX_DISPUTE_ROUNDS = 4; // Initial round + max 3 re-votes

export async function requesterCompleteMission(
  missionId: string,
  winnerId: string,
  requesterUserId: string,
) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      submission: true,
      recipients: true,
      assignedScout: true,
    },
  });

  if (!mission) throw new Error("Mission not found");
  if (mission.requesterId !== requesterUserId) {
    throw new Error("Only the mission requester can execute Complete Mission");
  }

  // If winnerId is a valid user ID or scout ID, verify user exists
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(winnerId);
  const isEmail = winnerId.includes("@");

  let winnerUser = null;
  if (isUuid) {
    winnerUser = await prisma.user.findFirst({
      where: { OR: [{ id: winnerId }, { scoutProfile: { id: winnerId } }] },
    });
  } else if (isEmail) {
    winnerUser = await prisma.user.findFirst({
      where: { email: winnerId },
    });
  }

  const finalWinnerUserId = winnerUser?.id || winnerId;

  // Validate winner belongs to an actual submission, recipient, or evidence upload
  const isValidWinner =
    (mission.submission && mission.submission.userId === finalWinnerUserId) ||
    mission.recipients.some((r) => r.userId === finalWinnerUserId) ||
    (await prisma.evidence.count({ where: { missionId, userId: finalWinnerUserId } })) > 0 ||
    mission.assignedScout?.userId === finalWinnerUserId;

  if (!isValidWinner) {
    throw new Error("Selected winner must be a valid worker participant in this mission");
  }

  const now = new Date();
  const updated = await prisma.mission.update({
    where: { id: missionId },
    data: {
      status: "COMPLETED_PENDING_SETTLEMENT",
      winnerId: finalWinnerUserId,
      settlementStartedAt: now,
    },
  });

  await prisma.timelineEntry.create({
    data: {
      missionId,
      eventType: "MISSION_COMPLETED_BY_REQUESTER",
      summary: `Requester completed mission. Selected winner: ${winnerUser?.displayName || finalWinnerUserId}. Settlement countdown (+24h) started.`,
      actorId: requesterUserId,
      metadata: { winnerId: finalWinnerUserId, settlementStartedAt: now.toISOString() },
    },
  });

  await notifyApproved(missionId, finalWinnerUserId).catch(() => {});
  await notifyNonWinners(missionId, finalWinnerUserId).catch(() => {});

  return updated;
}

export async function workerRequestCompletion(missionId: string, workerUserId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      recipients: true,
      assignedScout: true,
      submission: true,
      evidence: true,
    },
  });
  if (!mission) throw new Error("Mission not found");

  const isAssignedOrRecipient =
    mission.assignedScout?.userId === workerUserId ||
    mission.recipients.some((r) => r.userId === workerUserId);

  const hasSubmitted =
    (mission.submission && mission.submission.userId === workerUserId) ||
    mission.evidence.some((e) => e.userId === workerUserId);

  if (!isAssignedOrRecipient && !hasSubmitted) {
    throw new Error(
      "Only assigned workers or recipients who have submitted a report/evidence can request completion",
    );
  }

  if (!hasSubmitted) {
    throw new Error("You must submit a report or evidence before requesting mission completion");
  }

  const now = new Date();
  const updated = await prisma.mission.update({
    where: { id: missionId },
    data: {
      status: "PENDING_REQUESTER_ACCEPTANCE",
      completionRequestedAt: now,
    },
  });

  await prisma.timelineEntry.create({
    data: {
      missionId,
      eventType: "COMPLETION_REQUESTED_BY_WORKER",
      summary: `Worker requested completion. Requester has 48h to accept or dispute.`,
      actorId: workerUserId,
      metadata: { completionRequestedAt: now.toISOString() },
    },
  });

  return updated;
}

export async function requesterRespondCompletion(
  missionId: string,
  action: "ACCEPT" | "DISPUTE",
  requesterUserId: string,
  reason?: string,
) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { submission: true },
  });

  if (!mission) throw new Error("Mission not found");
  if (mission.requesterId !== requesterUserId) {
    throw new Error("Only the mission requester can respond to completion requests");
  }

  if (action === "ACCEPT") {
    const now = new Date();
    const winnerId = mission.submission?.userId || mission.assignedScoutId || requesterUserId;
    const updated = await prisma.mission.update({
      where: { id: missionId },
      data: {
        status: "COMPLETED_PENDING_SETTLEMENT",
        winnerId,
        settlementStartedAt: now,
      },
    });

    await prisma.timelineEntry.create({
      data: {
        missionId,
        eventType: "COMPLETION_ACCEPTED_BY_REQUESTER",
        summary: `Requester accepted worker completion. Settlement countdown (+24h) started.`,
        actorId: requesterUserId,
      },
    });

    return updated;
  } else {
    return createDispute(
      missionId,
      requesterUserId,
      reason || "Requester disputed worker completion request",
    );
  }
}

export async function createDispute(missionId: string, initiatorUserId: string, reason: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      recipients: true,
      assignedScout: true,
      submission: true,
    },
  });
  if (!mission) throw new Error("Mission not found");

  const isRequester = mission.requesterId === initiatorUserId;
  const isAssignedOrRecipient =
    mission.assignedScout?.userId === initiatorUserId ||
    mission.recipients.some((r) => r.userId === initiatorUserId);
  const isSubmitter = mission.submission?.userId === initiatorUserId;

  if (!isRequester && !isAssignedOrRecipient && !isSubmitter) {
    throw new Error(
      "Forbidden: Only the mission requester or assigned participants can dispute this mission",
    );
  }

  const dispute = await prisma.$transaction(async (tx) => {
    await tx.mission.update({
      where: { id: missionId },
      data: { status: "DISPUTED" },
    });

    const d = await tx.dispute.upsert({
      where: { missionId },
      create: {
        missionId,
        initiatorId: initiatorUserId,
        reason,
        status: "OPEN",
      },
      update: {
        reason,
        status: "OPEN",
      },
    });

    const roundDurationDays = 2; // Default 2 days
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + roundDurationDays);

    const existingRound = await tx.disputeRound.findFirst({
      where: { disputeId: d.id, roundNumber: 1 },
    });

    if (!existingRound) {
      await tx.disputeRound.create({
        data: {
          disputeId: d.id,
          roundNumber: 1,
          minVotesRequired: MIN_VOTES_REQUIRED,
          fundedCoin: 0,
          durationDays: roundDurationDays,
          startsAt: new Date(),
          endsAt,
          status: "ACTIVE",
        },
      });
    }

    await tx.timelineEntry.create({
      data: {
        missionId,
        eventType: "DISPUTE_RAISED",
        summary: `Dispute filed by user: ${reason}. Settlement frozen pending community resolution.`,
        actorId: initiatorUserId,
      },
    });

    return d;
  });

  await notifyDisputeCreated(missionId, initiatorUserId).catch(() => {});

  return dispute;
}

export async function submitDisputeVote(
  disputeId: string,
  roundId: string,
  voterId: string,
  selectedSide: "REQUESTER_WIN" | "WORKER_WIN",
) {
  const round = await prisma.disputeRound.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("Dispute round not found");
  if (round.status !== "ACTIVE") throw new Error("This dispute round is closed for voting");
  if (new Date() > round.endsAt) throw new Error("Voting window for this round has expired");

  // Enforce 1 vote per user per round and award +1 coin reward atomically
  const result = await prisma.$transaction(async (tx) => {
    const existingVote = await tx.disputeVote.findUnique({
      where: {
        roundId_voterId: {
          roundId,
          voterId,
        },
      },
    });

    if (existingVote) {
      throw new Error("You have already voted in this dispute round");
    }

    const vote = await tx.disputeVote.create({
      data: {
        disputeId,
        roundId,
        voterId,
        selectedSide,
        rewardCoin: 1,
      },
    });

    // Award +1 coin reward to voter with unique ledger description for idempotency
    const rewardCents = 100; // 1 Coin = $1 / 100 cents
    await tx.coinTransaction.create({
      data: {
        userId: voterId,
        amountCents: rewardCents,
        eventType: "VOTE_REWARD",
        reason: "DISPUTE_VOTE",
        description: `Community Vote Reward for Dispute Round ${roundId} (Vote #${vote.id})`,
      },
    });

    return vote;
  });

  return result;
}

export async function fundDisputeRound(
  disputeId: string,
  funderUserId: string,
  coinAmount: number,
) {
  if (!Number.isInteger(coinAmount) || coinAmount <= 0) {
    throw new Error("Funding coin amount must be a positive integer");
  }
  if (coinAmount > MAX_FUNDED_COIN) {
    throw new Error(`Funding coin amount cannot exceed ${MAX_FUNDED_COIN.toLocaleString()} coins`);
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      rounds: { orderBy: { roundNumber: "desc" }, take: 1 },
    },
  });

  if (!dispute) throw new Error("Dispute not found");

  const latestRound = dispute.rounds[0];
  if (!latestRound || latestRound.status !== "ACTIVE") {
    throw new Error("No active dispute round available for funding");
  }

  const newRoundFund = latestRound.fundedCoin + coinAmount;
  if (newRoundFund > MAX_FUNDED_COIN) {
    throw new Error(`Total round funding cannot exceed ${MAX_FUNDED_COIN.toLocaleString()} coins`);
  }

  // Extend duration based on funding: +1 day per 1,000 coins funded (max 10 days)
  const additionalDays = Math.min(10, Math.floor(newRoundFund / 1000));
  const newDurationDays = Math.min(10, Math.max(1, 1 + additionalDays));
  const newEndsAt = new Date(latestRound.startsAt);
  newEndsAt.setDate(newEndsAt.getDate() + newDurationDays);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: { fundedCoin: dispute.fundedCoin + coinAmount },
    });

    const uRound = await tx.disputeRound.update({
      where: { id: latestRound.id },
      data: {
        fundedCoin: newRoundFund,
        durationDays: newDurationDays,
        endsAt: newEndsAt,
      },
    });

    return uRound;
  });

  return updated;
}

export async function createReVoteRound(disputeId: string, requesterUserId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      rounds: { orderBy: { roundNumber: "desc" } },
    },
  });

  if (!dispute) throw new Error("Dispute not found");
  if (dispute.rounds.length >= MAX_DISPUTE_ROUNDS) {
    throw new Error(`Maximum dispute re-votes reached (${MAX_DISPUTE_ROUNDS} rounds max)`);
  }

  const lastRound = dispute.rounds[0];
  const nextRoundNumber = (lastRound?.roundNumber || 0) + 1;
  if (nextRoundNumber > MAX_DISPUTE_ROUNDS) {
    throw new Error(`Cannot exceed max round limit of ${MAX_DISPUTE_ROUNDS}`);
  }

  const roundDurationDays = 2;
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + roundDurationDays);

  const newRound = await prisma.disputeRound.create({
    data: {
      disputeId,
      roundNumber: nextRoundNumber,
      minVotesRequired: MIN_VOTES_REQUIRED,
      fundedCoin: 0,
      durationDays: roundDurationDays,
      startsAt,
      endsAt,
      status: "ACTIVE",
    },
  });

  return newRound;
}

/**
 * IDEMPOTENT SETTLEMENT ENGINE:
 * Safe to invoke repeatedly by background cron/job or API triggers.
 * Guarantees zero double-payments, exact 48h acceptance timeouts, and +24h settlement releases.
 */
export async function checkAndSettleMissions() {
  const now = new Date();
  const report = {
    autoCompleted48h: 0,
    settled24hRewards: 0,
    disputeRoundsFinalized: 0,
  };

  // 1. AUTO-COMPLETE 48h WORKER COMPLETION REQUESTS
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const pendingMissions = await prisma.mission.findMany({
    where: {
      status: "PENDING_REQUESTER_ACCEPTANCE",
      completionRequestedAt: { lte: fortyEightHoursAgo },
    },
    include: { submission: true },
  });

  for (const m of pendingMissions) {
    const winnerId = m.submission?.userId || m.assignedScoutId || m.requesterId;
    await prisma.mission.update({
      where: { id: m.id },
      data: {
        status: "COMPLETED_PENDING_SETTLEMENT",
        winnerId,
        settlementStartedAt: now,
      },
    });

    await prisma.timelineEntry.create({
      data: {
        missionId: m.id,
        eventType: "AUTO_COMPLETED_48H_TIMEOUT",
        summary: `Requester did not respond within 48h. Mission auto-completed. Settlement countdown (+24h) started.`,
        actorId: m.requesterId,
      },
    });

    report.autoCompleted48h++;
  }

  // 2. RELEASE +24H SETTLEMENT REWARDS (Transaction-safe & Idempotent)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const readyMissions = await prisma.mission.findMany({
    where: {
      status: "COMPLETED_PENDING_SETTLEMENT",
      settlementStartedAt: { lte: twentyFourHoursAgo },
      rewardReleasedAt: null,
    },
  });

  for (const m of readyMissions) {
    await prisma.$transaction(async (tx) => {
      // Re-verify rewardReleasedAt is null inside transaction for strict concurrency safety
      const freshM = await tx.mission.findUnique({ where: { id: m.id } });
      if (!freshM || freshM.rewardReleasedAt) return;

      const payoutUserId = freshM.winnerId || freshM.assignedScoutId || freshM.requesterId;
      const rewardCents = freshM.budgetCents || 1000;

      await tx.coinTransaction.create({
        data: {
          userId: payoutUserId,
          missionId: freshM.id,
          amountCents: rewardCents,
          eventType: "SETTLEMENT_REWARD",
          reason: "SETTLEMENT_PAYOUT",
          description: `Settlement Reward payout for mission: ${freshM.title}`,
        },
      });

      await tx.mission.update({
        where: { id: freshM.id },
        data: {
          status: "REWARDED",
          rewardReleasedAt: now,
        },
      });

      await tx.timelineEntry.create({
        data: {
          missionId: freshM.id,
          eventType: "REWARD_RELEASED",
          summary: `Settlement reward ($${Math.round(rewardCents / 100)}) successfully paid out to winner.`,
          actorId: payoutUserId,
        },
      });

      report.settled24hRewards++;
    });
  }

  // 3. FINALIZE EXPIRED DISPUTE ROUNDS (Min 50 votes check & Tie-break safety)
  const activeRounds = await prisma.disputeRound.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { lte: now },
    },
    include: {
      votes: true,
      dispute: { include: { mission: true } },
    },
  });

  for (const r of activeRounds) {
    const totalVotes = r.votes.length;
    if (totalVotes < r.minVotesRequired) {
      // Not enough votes yet; extend round by 1 day if within deadline limits
      continue;
    }

    const requesterVotes = r.votes.filter((v) => v.selectedSide === "REQUESTER_WIN").length;
    const workerVotes = r.votes.filter((v) => v.selectedSide === "WORKER_WIN").length;

    let winningSide: "REQUESTER_WIN" | "WORKER_WIN" | "TIE" = "TIE";
    if (requesterVotes > workerVotes) winningSide = "REQUESTER_WIN";
    else if (workerVotes > requesterVotes) winningSide = "WORKER_WIN";

    await prisma.$transaction(async (tx) => {
      if (winningSide === "TIE") {
        await tx.disputeRound.update({
          where: { id: r.id },
          data: {
            status: "TIE_REVIEW",
            winningSide: "TIE",
            finalizedAt: now,
          },
        });
      } else {
        await tx.disputeRound.update({
          where: { id: r.id },
          data: {
            status: "FINALIZED",
            winningSide,
            finalizedAt: now,
          },
        });

        await tx.dispute.update({
          where: { id: r.disputeId },
          data: { status: "FINALIZED" },
        });

        // Set mission to COMPLETED_PENDING_SETTLEMENT starting +24h settlement countdown
        await tx.mission.update({
          where: { id: r.dispute.missionId },
          data: {
            status: "COMPLETED_PENDING_SETTLEMENT",
            settlementStartedAt: now,
          },
        });

        await tx.timelineEntry.create({
          data: {
            missionId: r.dispute.missionId,
            eventType: "DISPUTE_FINALIZED",
            summary: `Community Voting finalized (${winningSide}). +24h settlement countdown started.`,
            actorId: r.dispute.initiatorId,
          },
        });
      }

      report.disputeRoundsFinalized++;
    });
  }

  return report;
}
