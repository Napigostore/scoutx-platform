import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  TimelineEntryRecord,
  CreateTimelineEntryInput,
  TimelineRepository,
} from "./TimelineRepository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castJson(value: any): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

export class PrismaTimelineRepository implements TimelineRepository {
  async create(input: CreateTimelineEntryInput): Promise<TimelineEntryRecord> {
    const record = await prisma.timelineEntry.create({
      data: {
        id: input.id,
        missionId: input.missionId,
        eventType: input.eventType,
        summary: input.summary,
        actorId: input.actorId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue,
      },
    });
    return {
      ...record,
      metadata: castJson(record.metadata),
    };
  }

  async findById(id: string): Promise<TimelineEntryRecord | null> {
    const record = await prisma.timelineEntry.findUnique({
      where: { id },
    });
    if (!record) return null;
    return {
      ...record,
      metadata: castJson(record.metadata),
    };
  }

  async findByMissionId(missionId: string): Promise<readonly TimelineEntryRecord[]> {
    const records = await prisma.timelineEntry.findMany({
      where: { missionId },
      orderBy: { createdAt: "asc" },
    });
    return records.map((r) => ({
      ...r,
      metadata: castJson(r.metadata),
    }));
  }

  async findByMissionIdSince(
    missionId: string,
    since: Date,
  ): Promise<readonly TimelineEntryRecord[]> {
    const records = await prisma.timelineEntry.findMany({
      where: {
        missionId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    });
    return records.map((r) => ({
      ...r,
      metadata: castJson(r.metadata),
    }));
  }

  async countByMissionId(missionId: string): Promise<number> {
    return prisma.timelineEntry.count({
      where: { missionId },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.timelineEntry.deleteMany({
      where: { id },
    });
    return result.count > 0;
  }
}
