import type {
  MatchResult,
  MatchScoreBreakdown,
  MatchingWeights,
  Mission,
  ScoutProfile,
} from "@scoutx/types";

import { distanceMeters } from "./geo.js";
import { DEFAULT_MATCHING_WEIGHTS, normalizeWeights } from "./weights.js";

export interface RankScoutsOptions {
  mission: Mission;
  scouts: ScoutProfile[];
  weights?: MatchingWeights;
  limit?: number;
  now?: Date;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function scoreDistance(distance: number, missionRadius: number, scoutMaxRadius: number): number {
  const effectiveRadius = Math.min(missionRadius, scoutMaxRadius);
  if (effectiveRadius <= 0) {
    return 0;
  }
  if (distance > effectiveRadius) {
    return 0;
  }
  return clamp01(1 - distance / effectiveRadius);
}

function scoreReliability(score: number): number {
  return clamp01(score / 100);
}

function scoreCategoryFit(mission: Mission, scout: ScoutProfile): number {
  return scout.categories.includes(mission.category) ? 1 : 0.15;
}

function scoreTagOverlap(mission: Mission, scout: ScoutProfile): number {
  if (mission.requiredTags.length === 0) {
    return 1;
  }

  const scoutTags = new Set(scout.tags.map((tag) => tag.toLowerCase()));
  const matches = mission.requiredTags.filter((tag) => scoutTags.has(tag.toLowerCase()));
  return clamp01(matches.length / mission.requiredTags.length);
}

function scoreAvailability(scout: ScoutProfile): number {
  switch (scout.availability) {
    case "AVAILABLE":
      return 1;
    case "BUSY":
      return 0.35;
    case "OFFLINE":
      return 0;
    default: {
      const _exhaustive: never = scout.availability;
      return _exhaustive;
    }
  }
}

function scoreUrgencyAlignment(mission: Mission, scout: ScoutProfile, now: Date): number {
  const msRemaining = mission.expiresAt.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return 0;
  }

  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  const urgencyPressure =
    mission.urgency === "CRITICAL"
      ? 1
      : mission.urgency === "HIGH"
        ? 0.75
        : mission.urgency === "NORMAL"
          ? 0.5
          : 0.25;

  const reliabilityBoost =
    scout.reliabilityScore >= 80 ? 1 : scout.reliabilityScore >= 60 ? 0.75 : 0.4;
  const timeWindow = hoursRemaining < 2 ? 1 : hoursRemaining < 6 ? 0.8 : 0.55;

  return clamp01(urgencyPressure * reliabilityBoost * timeWindow);
}

function buildReasons(
  breakdown: MatchScoreBreakdown,
  distance: number,
  scout: ScoutProfile,
  mission: Mission,
): string[] {
  const reasons: string[] = [];

  if (breakdown.distance >= 0.7) {
    reasons.push(`Within ${(distance / 1000).toFixed(1)} km of the mission area`);
  } else if (breakdown.distance > 0) {
    reasons.push(`Reachable at ${(distance / 1000).toFixed(1)} km`);
  }

  if (breakdown.categoryFit === 1) {
    reasons.push(`Specializes in ${mission.category.toLowerCase().replaceAll("_", " ")}`);
  }

  if (breakdown.reliability >= 0.8) {
    reasons.push(`High reliability (${scout.reliabilityScore.toFixed(0)}/100)`);
  } else if (breakdown.reliability >= 0.6) {
    reasons.push(`Solid track record (${scout.completedMissions} missions)`);
  }

  if (breakdown.tagOverlap >= 0.5 && mission.requiredTags.length > 0) {
    reasons.push("Matches required mission tags");
  }

  if (breakdown.availability === 1) {
    reasons.push("Currently available");
  }

  if (reasons.length === 0) {
    reasons.push("Partial fit based on location and profile");
  }

  return reasons;
}

function scoreScout(
  mission: Mission,
  scout: ScoutProfile,
  weights: MatchingWeights,
  now: Date,
): MatchResult | null {
  if (scout.availability === "OFFLINE") {
    return null;
  }

  const scoutCoordinates = scout.currentCoordinates;
  if (!scoutCoordinates) {
    return null;
  }

  const distance = distanceMeters(mission.coordinates, scoutCoordinates);
  if (distance > mission.radiusMeters || distance > scout.maxRadiusMeters) {
    return null;
  }

  const breakdown: MatchScoreBreakdown = {
    distance: scoreDistance(distance, mission.radiusMeters, scout.maxRadiusMeters),
    reliability: scoreReliability(scout.reliabilityScore),
    categoryFit: scoreCategoryFit(mission, scout),
    tagOverlap: scoreTagOverlap(mission, scout),
    availability: scoreAvailability(scout),
    urgencyAlignment: scoreUrgencyAlignment(mission, scout, now),
  };

  if (breakdown.distance === 0 || breakdown.availability === 0) {
    return null;
  }

  const score = clamp01(
    breakdown.distance * weights.distance +
      breakdown.reliability * weights.reliability +
      breakdown.categoryFit * weights.categoryFit +
      breakdown.tagOverlap * weights.tagOverlap +
      breakdown.availability * weights.availability +
      breakdown.urgencyAlignment * weights.urgencyAlignment,
  );

  return {
    scoutId: scout.id,
    missionId: mission.id,
    score,
    distanceMeters: Math.round(distance),
    breakdown,
    reasons: buildReasons(breakdown, distance, scout, mission),
  };
}

/** Rank eligible scouts for a mission using weighted multi-factor scoring. */
export function rankScoutsForMission(options: RankScoutsOptions): MatchResult[] {
  const weights = normalizeWeights(options.weights ?? DEFAULT_MATCHING_WEIGHTS);
  const now = options.now ?? new Date();
  const limit = options.limit ?? 10;

  if (options.mission.expiresAt.getTime() <= now.getTime()) {
    return [];
  }

  const results: MatchResult[] = [];

  for (const scout of options.scouts) {
    const result = scoreScout(options.mission, scout, weights, now);
    if (result) {
      results.push(result);
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

export function bestScoutForMission(options: RankScoutsOptions): MatchResult | null {
  const [best] = rankScoutsForMission({ ...options, limit: 1 });
  return best ?? null;
}
