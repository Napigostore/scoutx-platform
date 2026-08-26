import type { TimelineEntry } from "./TimelineEntry.js";
import type { TimelineRepository } from "./TimelineRepository.js";

/**
 * In-memory implementation of TimelineRepository for testing.
 */
export class InMemoryTimelineRepository implements TimelineRepository {
  private entries = new Map<string, TimelineEntry>();

  async save(entry: TimelineEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async findById(id: string): Promise<TimelineEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async findByMissionId(missionId: string): Promise<readonly TimelineEntry[]> {
    return Array.from(this.entries.values())
      .filter((e) => e.missionId === missionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByUserId(userId: string): Promise<readonly TimelineEntry[]> {
    return Array.from(this.entries.values())
      .filter((e) => e.actorId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
