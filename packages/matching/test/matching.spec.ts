import { describe, expect, it } from "vitest";
import type { Coordinates, MatchingWeights, Mission, ScoutProfile } from "@scoutx/types";
import { distanceMeters } from "../src/geo.js";
import { normalizeWeights } from "../src/weights.js";
import { rankScoutsForMission, bestScoutForMission } from "../src/rank.js";

describe("matching package tests", () => {
  describe("geo", () => {
    it("calculates distance correctly", () => {
      const a: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const b: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      const dist = distanceMeters(a, b);
      expect(dist).toBeGreaterThan(3000000);
      expect(dist).toBeLessThan(4500000);
    });
  });

  describe("weights", () => {
    it("normalizes weights correctly", () => {
      const customWeights: MatchingWeights = {
        distance: 1,
        reliability: 1,
        categoryFit: 1,
        tagOverlap: 1,
        availability: 1,
        urgencyAlignment: 1,
      };
      const normalized = normalizeWeights(customWeights);
      expect(normalized.distance).toBeCloseTo(1 / 6);
      expect(normalized.reliability).toBeCloseTo(1 / 6);
    });

    it("throws error if total weights are zero or negative", () => {
      const badWeights: MatchingWeights = {
        distance: 0,
        reliability: 0,
        categoryFit: 0,
        tagOverlap: 0,
        availability: 0,
        urgencyAlignment: 0,
      };
      expect(() => normalizeWeights(badWeights)).toThrow(
        "Matching weights must sum to a positive value",
      );
    });
  });

  describe("rankScoutsForMission", () => {
    const mockMission: Mission = {
      id: "mission-1",
      title: "Verify Gate",
      description: "Check the south gate",
      category: "SECURITY",
      status: "OPEN",
      urgency: "HIGH",
      coordinates: { latitude: 40.7128, longitude: -74.006 },
      radiusMeters: 5000,
      rewardAmount: 50,
      rewardCurrency: "USD",
      requiredTags: ["gate", "night"],
      createdAt: new Date("2025-01-01T12:00:00Z"),
      expiresAt: new Date("2025-01-01T18:00:00Z"),
      creatorId: "user-1",
    };

    const mockScout: ScoutProfile = {
      id: "scout-1",
      userId: "user-2",
      displayName: "Scout One",
      bio: "Experienced scout",
      avatarUrl: null,
      availability: "AVAILABLE",
      currentCoordinates: { latitude: 40.713, longitude: -74.0062 },
      maxRadiusMeters: 10000,
      reliabilityScore: 90,
      completedMissions: 15,
      categories: ["SECURITY", "DELIVERY"],
      tags: ["gate", "night", "camera"],
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    };

    it("ranks eligible scouts and returns match results", () => {
      const now = new Date("2025-01-01T14:00:00Z");
      const results = rankScoutsForMission({
        mission: mockMission,
        scouts: [mockScout],
        now,
      });

      expect(results).toHaveLength(1);
      expect(results[0].scoutId).toBe("scout-1");
      expect(results[0].score).toBeGreaterThan(0.5);
      expect(results[0].reasons).toContain("Matches required mission tags");
      expect(results[0].reasons).toContain("Currently available");
    });

    it("returns empty array if mission is expired", () => {
      const now = new Date("2025-01-01T19:00:00Z");
      const results = rankScoutsForMission({
        mission: mockMission,
        scouts: [mockScout],
        now,
      });
      expect(results).toHaveLength(0);
    });

    it("excludes offline scouts", () => {
      const offlineScout: ScoutProfile = {
        ...mockScout,
        availability: "OFFLINE",
      };
      const results = rankScoutsForMission({
        mission: mockMission,
        scouts: [offlineScout],
        now: new Date("2025-01-01T14:00:00Z"),
      });
      expect(results).toHaveLength(0);
    });

    it("excludes scouts outside the mission radius", () => {
      const farScout: ScoutProfile = {
        ...mockScout,
        currentCoordinates: { latitude: 45.0, longitude: -74.0 }, // very far
      };
      const results = rankScoutsForMission({
        mission: mockMission,
        scouts: [farScout],
        now: new Date("2025-01-01T14:00:00Z"),
      });
      expect(results).toHaveLength(0);
    });

    it("finds the best scout using bestScoutForMission", () => {
      const now = new Date("2025-01-01T14:00:00Z");
      const best = bestScoutForMission({
        mission: mockMission,
        scouts: [mockScout],
        now,
      });
      expect(best).not.toBeNull();
      expect(best?.scoutId).toBe("scout-1");
    });
  });
});
