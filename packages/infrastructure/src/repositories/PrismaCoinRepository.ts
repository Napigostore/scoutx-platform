import { prisma } from "../lib/prisma";
import type {
  CoinTransactionRecord,
  CreateCoinTransactionInput,
  WithdrawalRequestRecord,
  CoinRepository,
} from "./CoinRepository";

export class PrismaCoinRepository implements CoinRepository {
  async create(input: CreateCoinTransactionInput): Promise<CoinTransactionRecord> {
    const record = await prisma.coinTransaction.create({
      data: {
        id: input.id,
        userId: input.userId,
        amountCents: input.amountCents,
        currency: input.currency ?? "COIN",
        reason: input.reason,
        description: input.description ?? null,
        eventType: input.eventType,
        missionId: input.missionId ?? null,
      },
    });
    return record;
  }

  async findById(id: string): Promise<CoinTransactionRecord | null> {
    const record = await prisma.coinTransaction.findUnique({ where: { id } });
    return record;
  }

  async findByUserId(userId: string): Promise<readonly CoinTransactionRecord[]> {
    return prisma.coinTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async findByMissionId(missionId: string): Promise<readonly CoinTransactionRecord[]> {
    return prisma.coinTransaction.findMany({
      where: { missionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async balanceByUserId(userId: string): Promise<number> {
    const result = await prisma.coinTransaction.aggregate({
      where: { userId },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0;
  }

  async sumByMissionId(missionId: string): Promise<number> {
    const result = await prisma.coinTransaction.aggregate({
      where: { missionId },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0;
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.coinTransaction.count({ where: { userId } });
  }

  async requestWithdrawalAtomically(
    userId: string,
    amountCents: number,
    idempotencyKey: string,
  ): Promise<WithdrawalRequestRecord> {
    if (amountCents <= 0) {
      throw new Error("Withdrawal amount must be greater than zero");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Check idempotency Key
      const existing = await tx.withdrawalRequest.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing as WithdrawalRequestRecord;
      }

      // 2. Calculate current available balance
      const balanceResult = await tx.coinTransaction.aggregate({
        where: { userId },
        _sum: { amountCents: true },
      });
      const availableBalance = balanceResult._sum.amountCents ?? 0;

      if (amountCents > availableBalance) {
        throw new Error("Insufficient available balance for withdrawal");
      }

      // 3. Create WithdrawalRequest
      const withdrawalId = crypto.randomUUID();
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          id: withdrawalId,
          userId,
          amountCents,
          status: "PENDING",
          idempotencyKey,
        },
      });

      // 4. Create negative CoinTransaction debit reservation
      await tx.coinTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          amountCents: -amountCents,
          currency: "USD",
          reason: `Worker Withdrawal Request (${withdrawalId})`,
          description: `Debit reservation for pending withdrawal request`,
          eventType: "Withdrawal",
        },
      });

      return withdrawalRequest as WithdrawalRequestRecord;
    });
  }
}
