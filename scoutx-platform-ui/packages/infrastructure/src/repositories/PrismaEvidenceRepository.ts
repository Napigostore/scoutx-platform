import { prisma } from "../lib/prisma";
import type { EvidenceRecord, CreateEvidenceInput, EvidenceRepository } from "./EvidenceRepository";

export class PrismaEvidenceRepository implements EvidenceRepository {
  async create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const record = await prisma.evidence.create({
      data: {
        id: input.id,
        missionId: input.missionId,
        scoutId: input.scoutId,
        userId: input.userId,
        caption: input.caption,
        type: input.type,
        mediaUrl: input.mediaUrl ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        location: input.location ?? null,
        capturedAt: input.capturedAt ?? new Date(),
      },
    });
    return record;
  }

  async findById(id: string): Promise<EvidenceRecord | null> {
    const record = await prisma.evidence.findUnique({
      where: { id },
    });
    return record;
  }

  async findByMissionId(missionId: string): Promise<readonly EvidenceRecord[]> {
    return prisma.evidence.findMany({
      where: { missionId },
      orderBy: { capturedAt: "desc" },
    });
  }

  async findByScoutId(scoutId: string): Promise<readonly EvidenceRecord[]> {
    return prisma.evidence.findMany({
      where: { scoutId },
      orderBy: { capturedAt: "desc" },
    });
  }

  async verify(id: string): Promise<boolean> {
    const result = await prisma.evidence.updateMany({
      where: { id },
      data: { verified: true },
    });
    return result.count > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.evidence.deleteMany({
      where: { id },
    });
    return result.count > 0;
  }

  async countByMissionId(missionId: string): Promise<number> {
    return prisma.evidence.count({
      where: { missionId },
    });
  }
}
