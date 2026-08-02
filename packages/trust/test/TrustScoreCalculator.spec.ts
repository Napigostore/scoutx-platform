import { describe, expect, it } from "vitest";
import { TrustScoreCalculator } from "../src/TrustScoreCalculator.js";

describe("TrustScoreCalculator", () => {
  const calculator = new TrustScoreCalculator();

  describe("calculateOnApproval", () => {
    it("should give +5 to scout and +1 to requester", () => {
      const adjustment = calculator.calculateOnApproval();

      expect(adjustment.scoutDelta).toBe(5);
      expect(adjustment.requesterDelta).toBe(1);
      expect(adjustment.reason).toBe("mission.approved");
    });
  });

  describe("calculateOnRejection", () => {
    it("should give -3 to scout and 0 to requester", () => {
      const adjustment = calculator.calculateOnRejection();

      expect(adjustment.scoutDelta).toBe(-3);
      expect(adjustment.requesterDelta).toBe(0);
      expect(adjustment.reason).toBe("mission.rejected");
    });
  });

  describe("applyAdjustment", () => {
    it("should add delta to current score", () => {
      expect(calculator.applyAdjustment(50, 5)).toBe(55);
      expect(calculator.applyAdjustment(50, -10)).toBe(40);
    });

    it("should clamp score to minimum 0", () => {
      expect(calculator.applyAdjustment(2, -10)).toBe(0);
    });

    it("should clamp score to maximum 100", () => {
      expect(calculator.applyAdjustment(98, 5)).toBe(100);
    });

    it("should keep score unchanged with zero delta", () => {
      expect(calculator.applyAdjustment(50, 0)).toBe(50);
    });

    it("should handle edge case of 0 + positive delta", () => {
      expect(calculator.applyAdjustment(0, 5)).toBe(5);
    });

    it("should handle edge case of 100 + negative delta", () => {
      expect(calculator.applyAdjustment(100, -3)).toBe(97);
    });
  });
});
