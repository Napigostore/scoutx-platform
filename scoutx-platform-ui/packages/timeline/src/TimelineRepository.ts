import type { TimelineEntry } from "./TimelineEntry.js";

/**
 * Repository for storing and querying timeline entries.
 */
export interface TimelineRepository {
  /**
   * Record a new timeline entry.
   */
  save(entry: TimelineEntry): Promise<void>;

  /**
   * Get all entries for a given mission, ordered by most recent first.
   */
  findByMissionId(missionId: string): Promise<readonly TimelineEntry[]>;

  /**
   * Get all entries involving a given user (as actor), ordered by most recent first.
   */
  findByUserId(userId: string): Promise<readonly TimelineEntry[]>;

  /**
   * Get a single entry by its id.
   */
  findById(id: string): Promise<TimelineEntry | null>;
}
