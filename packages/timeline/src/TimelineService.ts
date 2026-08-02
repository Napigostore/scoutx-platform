import type { EventBus, MissionDomainEvent } from "@scoutx/events";
import type { TimelineRepository } from "./TimelineRepository.js";
import type { TimelineEntry } from "./TimelineEntry.js";

/**
 * Service that records timeline entries in response to mission domain events.
 */
export class TimelineService {
  constructor(
    private readonly repo: TimelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Subscribe to all mission domain events and record timeline entries.
   */
  subscribe(): void {
    const events = [
      "mission.approved",
      "mission.rejected",
      "mission.cancelled",
      "submission.resubmitted",
    ] as const;
    for (const eventType of events) {
      this.eventBus.subscribe(eventType, (event) => {
        this.handleEvent(event as MissionDomainEvent).catch(() => {
          // handler failure silently swallowed to avoid crashing the bus
        });
      });
    }
  }

  /**
   * Handle a mission domain event and persist a timeline entry.
   */
  async handleEvent(event: MissionDomainEvent): Promise<void> {
    const entry = this.buildEntry(event);
    if (entry) {
      await this.repo.save(entry);
    }
  }

  private buildEntry(event: MissionDomainEvent): TimelineEntry | null {
    switch (event.type) {
      case "mission.approved":
        return {
          id: `tl-mission.approved-${event.missionId}`,
          missionId: event.missionId,
          eventType: event.type,
          summary: `Mission approved, rewarded scout ${event.scoutId}`,
          actorId: event.requesterId,
          metadata: {
            scoutId: event.scoutId,
            rewardAmountMinor: event.rewardAmount.amountMinor,
            rewardCurrency: event.rewardAmount.currency,
          },
          createdAt: event.timestamp,
        };

      case "mission.rejected":
        return {
          id: `tl-mission.rejected-${event.missionId}`,
          missionId: event.missionId,
          eventType: event.type,
          summary: `Mission rejected: ${event.rejectionReason}`,
          actorId: event.requesterId,
          metadata: {
            scoutId: event.scoutId,
            rejectionReason: event.rejectionReason,
          },
          createdAt: event.timestamp,
        };

      case "mission.cancelled":
        return {
          id: `tl-mission.cancelled-${event.missionId}`,
          missionId: event.missionId,
          eventType: event.type,
          summary: `Mission cancelled, refund issued`,
          actorId: event.requesterId,
          metadata: {
            refundAmountMinor: event.refundAmount.amountMinor,
            refundCurrency: event.refundAmount.currency,
          },
          createdAt: event.timestamp,
        };

      case "submission.resubmitted":
        return {
          id: `tl-submission.resubmitted-${event.missionId}`,
          missionId: event.missionId,
          eventType: event.type,
          summary: `Submission resubmitted: ${event.summary}`,
          actorId: event.scoutId,
          metadata: {
            summary: event.summary,
          },
          createdAt: event.timestamp,
        };

      default:
        // Unknown event type – ignore
        return null;
    }
  }
}
