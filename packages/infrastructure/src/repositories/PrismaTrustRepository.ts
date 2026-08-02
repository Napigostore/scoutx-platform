import { prisma } from "../lib/prisma";
import type {
  TrustScoreRecord,
  TrustActionRecord,
  CreateTrustActionInput,
  TrustRepository,
} from "./TrustRepository";

export class PrismaTrustRepository implements TrustRepository {
  async findScoreByUserId(userId: string): Promise<TrustScoreRecord | null> {
    const record = await prisma.trustScore.findUnique({
      where: { userId },
    });
    return record;
  }

  async upsertScore(userId: string, score: number): Promise<TrustScoreRecord> {
    const record = await prisma.trustScore.upsert({
      where: { userId },
      create: {
        userId,
        score,
      },
      update: {
        score,
      },
    });
    return record;
  }

  async createAction(input: CreateTrustActionInput): Promise<TrustActionRecord> {
    const record = await prisma.trustActionRecord.create({
      data: {
        id: input.id,
        actorId: input.actorId,
        targetId: input.targetId,
        action: input.action,
        missionId: input.missionId ?? null,
      },
    });
    return record;
  }

  async findActionsByTargetId(targetId: string): Promise<readonly TrustActionRecord[]> {
    return prisma.trustActionRecord.findMany({
      where: { targetId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findActionsByActorId(actorId: string): Promise<readonly TrustActionRecord[]> {
    return prisma.trustActionRecord.findMany({
      where: { actorId },
      orderBy: { createdAt: "desc" },
    });
  }

  async countActionsByTargetId(targetId: string): Promise<number> {
    return prisma.trustActionRecord.count({
      where: { targetId },
    });
  }
}
