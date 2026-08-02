import { prisma } from "../lib/prisma";
import type {
  CoinTransactionRecord,
  CreateCoinTransactionInput,
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
}
