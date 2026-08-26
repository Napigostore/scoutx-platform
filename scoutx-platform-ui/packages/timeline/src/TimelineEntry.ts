/**
 * A single entry on a mission timeline.
 */
export interface TimelineEntry {
  /**
   * Unique entry ID.
   */
  id: string;

  /**
   * The mission this entry belongs to.
   */
  missionId: string;

  /**
   * The event type that triggered this entry
   * (e.g. "mission.approved", "mission.rejected", "mission.cancelled", "submission.resubmitted").
   */
  eventType: string;

  /**
   * A human-readable summary of what happened.
   */
  summary: string;

  /**
   * The user ID of the actor who performed the action, if applicable.
   */
  actorId?: string;

  /**
   * Any additional metadata (e.g. rejection reason).
   */
  metadata?: Record<string, unknown>;

  /**
   * When the entry was recorded.
   */
  createdAt: string;
}
