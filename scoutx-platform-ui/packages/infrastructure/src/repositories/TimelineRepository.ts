/**
 * Timeline domain types for the repository layer.
 */

export interface TimelineEntryRecord {
  id: string;
  missionId: string;
  eventType: string;
  summary: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateTimelineEntryInput {
  id: string;
  missionId: string;
  eventType: string;
  summary: string;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface TimelineRepository {
  create(input: CreateTimelineEntryInput): Promise<TimelineEntryRecord>;
  findById(id: string): Promise<TimelineEntryRecord | null>;
  findByMissionId(missionId: string): Promise<readonly TimelineEntryRecord[]>;
  findByMissionIdSince(missionId: string, since: Date): Promise<readonly TimelineEntryRecord[]>;
  countByMissionId(missionId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
