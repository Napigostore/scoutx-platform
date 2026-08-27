import { type Prisma } from "@prisma/client";

export type CoinMovementType =
  | "MISSION_REWARD_LOCK"
  | "MISSION_REWARD_RELEASE"
  | "MISSION_REFUND"
  | "MISSION_REWARD_REVERSAL"
  | "VOTE_REWARD";

export async function recordCoinMovement(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    missionId?: string | null;
    type: CoinMovementType;
    amountCents: number;
    description: string;
    idempotencyKey?: string | null;
  },
) {
  const { userId, missionId, type, amountCents, description, idempotencyKey } = params;

  // 1. Idempotency Guard: Check if key exists
  if (idempotencyKey) {
    const existingLedger = await tx.coinLedger.findUnique({
      where: { idempotencyKey },
    });
    if (existingLedger) {
      return { alreadyProcessed: true, ledger: existingLedger };
    }
  }

  // 2. Atomic CoinLedger record
  const ledger = await tx.coinLedger.create({
    data: {
      userId,
      missionId: missionId ?? null,
      type,
      amount: amountCents,
      currency: "VND",
      status: "COMPLETED",
      idempotencyKey: idempotencyKey ?? null,
    },
  });

  // 3. Atomic CoinTransaction record for backward compatibility & balance calculation
  await tx.coinTransaction.create({
    data: {
      userId,
      missionId: missionId ?? null,
      amountCents,
      currency: "VND",
      reason: type,
      eventType: type.includes("LOCK")
        ? "DEBIT"
        : type.includes("RELEASE") || type.includes("REFUND") || type.includes("REWARD")
          ? "CREDIT"
          : "SYSTEM",
      description,
      idempotencyKey: idempotencyKey ?? null,
    },
  });

  return { alreadyProcessed: false, ledger };
}
