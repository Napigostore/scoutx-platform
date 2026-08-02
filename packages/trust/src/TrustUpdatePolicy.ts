import type { MissionDomainEvent } from "@scoutx/events";
import type { TrustAdjustment } from "./TrustScoreCalculator.js";

/**
 * Determines whether a trust update should occur for a given event,
 * and computes the trust adjustment to apply.
 */
export interface TrustUpdatePolicy {
  /**
   * Evaluate an event and return the trust adjustment if applicable.
   * Returns null if the event does not trigger a trust update.
   */
  evaluate(event: MissionDomainEvent): TrustAdjustment | null;
}
