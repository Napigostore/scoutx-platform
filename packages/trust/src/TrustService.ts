import type { MissionDomainEvent, EventBus } from "@scoutx/events";
import type { TrustScoreCalculator } from "./TrustScoreCalculator.js";
import type { TrustUpdatePolicy } from "./TrustUpdatePolicy.js";

/**
 * Represents a user's trust score in the system.
 */
export interface TrustScore {
  userId: string;
  score: number;
}

/**
 * Repository abstraction for reading/writing trust scores.
 * The actual implementation would be provided by the infrastructure layer.
 */
export interface TrustRepository {
  findById(userId: string): Promise<TrustScore | null>;
  save(trustScore: TrustScore): Promise<void>;
}

/**
 * Orchestrates trust score updates by reacting to mission domain events.
 */
export class TrustService {
  constructor(
    private readonly trustRepo: TrustRepository,
    private readonly calculator: TrustScoreCalculator,
    private readonly eventBus: EventBus,
    private readonly policy: TrustUpdatePolicy,
  ) {}

  /**
   * Subscribe to relevant domain events and handle trust updates.
   */
  subscribe(): void {
    this.eventBus.subscribe("mission.approved", (event_) => {
      if (event_.type !== "mission.approved") return;
      this.handleEvent(event_).catch((err) => {
        console.error("TrustService: failed to handle mission.approved", err);
      });
    });
    this.eventBus.subscribe("mission.rejected", (event_) => {
      if (event_.type !== "mission.rejected") return;
      this.handleEvent(event_).catch((err) => {
        console.error("TrustService: failed to handle mission.rejected", err);
      });
    });
  }

  /**
   * Handle a domain event and apply any trust adjustments.
   */
  async handleEvent(event: MissionDomainEvent): Promise<void> {
    // Anti-Abuse: Prevent self-dealing trust score farming (same user as requester and scout)
    if (
      "scoutId" in event &&
      "requesterId" in event &&
      event.scoutId &&
      event.scoutId === event.requesterId
    ) {
      return;
    }

    const adjustment = this.policy.evaluate(event);
    if (!adjustment) {
      return;
    }

    // Update scout trust score
    if ("scoutId" in event && event.scoutId && adjustment.scoutDelta !== 0) {
      const scout = await this.trustRepo.findById(event.scoutId);
      if (scout) {
        const newScore = this.calculator.applyAdjustment(scout.score, adjustment.scoutDelta);
        await this.trustRepo.save({ ...scout, score: newScore });
      }
    }

    // Update requester trust score
    if ("requesterId" in event && event.requesterId && adjustment.requesterDelta !== 0) {
      const requester = await this.trustRepo.findById(event.requesterId);
      if (requester) {
        const newScore = this.calculator.applyAdjustment(
          requester.score,
          adjustment.requesterDelta,
        );
        await this.trustRepo.save({ ...requester, score: newScore });
      }
    }
  }
}
