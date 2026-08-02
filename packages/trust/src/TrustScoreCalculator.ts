/**
 * Calculates trust score adjustments based on mission events.
 *
 * Base trust scores range from 0 to 100.
 * Adjustments are applied incrementally.
 */
export interface TrustAdjustment {
  scoutDelta: number;
  requesterDelta: number;
  reason: string;
}

export class TrustScoreCalculator {
  /**
   * Calculate trust adjustment when a mission is approved (scout's submission accepted).
   * - Scout: +5 for completing mission successfully
   * - Requester: +1 for providing a fair review
   */
  calculateOnApproval(): TrustAdjustment {
    return {
      scoutDelta: 5,
      requesterDelta: 1,
      reason: "mission.approved",
    };
  }

  /**
   * Calculate trust adjustment when a mission is rejected (scout's submission rejected).
   * - Scout: -3 for poor submission quality
   * - Requester: 0 (no change — rejecting is a valid action)
   */
  calculateOnRejection(): TrustAdjustment {
    return {
      scoutDelta: -3,
      requesterDelta: 0,
      reason: "mission.rejected",
    };
  }

  /**
   * Apply a trust adjustment to a current score, clamping between 0 and 100.
   */
  applyAdjustment(currentScore: number, delta: number): number {
    return Math.max(0, Math.min(100, currentScore + delta));
  }
}
