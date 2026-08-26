/* ─── Core Marketplace Ranking & Recommendation Engine ─── */

export interface RegionalReputation {
  scope: "global" | "country" | "state" | "city" | "district";
  regionName: string;
  category?: string;
  rank: number;
  score: number;
}

export interface CategoryReputation {
  category: string;
  categoryTrustScore: number;
  completedCount: number;
  verificationRate: number;
  level: number;
  xp: number;
}

export interface ScoutRankingProfile {
  scoutId: string;
  overallTrust: number;
  globalRank: number;
  countryRank: number;
  cityRank: number;
  radiusRank: number; // e.g. within 10km
  level: number;
  xp: number;
  categoryReputations: CategoryReputation[];
  regionalReputations?: RegionalReputation[];
  languages: string[];
  coverageAreaKm: number;
  avgTravelDistanceKm: number;
  currentWorkload: number;
  responseSpeedMinutes?: number;
  onlineActivityStatus?: "online" | "idle" | "offline";
  coordinates: { latitude: number; longitude: number };
}

export interface PaidPromotionConfig {
  type: "boost" | "featured" | "sponsored" | "priority_queue";
  level: "bronze" | "silver" | "gold" | "platinum";
  boostCoins: number;
  boostUntil: Date;
  weight?: number;
  reason?: string;
}

export interface MissionRankingInput {
  missionId: string;
  title: string;
  category: string;
  bountyAmountCents: number;
  createdAt: Date;
  expiresAt: Date;
  coordinates: { latitude: number; longitude: number };
  status: string;
  promotion?: PaidPromotionConfig;
}

export interface RankedMissionResult {
  missionId: string;
  score: number;
  promotionScore: number;
  urgencyScore: number;
  freshnessScore: number;
  distanceKm: number;
  bountyScore: number;
  categoryAffinityScore: number;
  scoutFitScore: number;
}

export interface HotZoneMetric {
  areaName: string;
  activeMissions: number;
  averageBountyCents: number;
  avgCompletionTimeHours: number;
  demandScore: number; // 0-100
  topCategories: string[];
}

export interface MarketplaceCategoryStat {
  category: string;
  averageBountyCents: number;
  acceptanceRate: number;
  completionRate: number;
  verificationRate: number;
  averageDurationHours: number;
}

export class MissionRankingEngine {
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  public static calculateMissionScore(
    mission: MissionRankingInput,
    scout: ScoutRankingProfile,
  ): RankedMissionResult {
    const distanceKm = this.calculateDistanceKm(
      scout.coordinates.latitude,
      scout.coordinates.longitude,
      mission.coordinates.latitude,
      mission.coordinates.longitude,
    );

    // 1. Paid Promotion Score (Boost, Featured, Sponsored, Priority Queue)
    let promotionScore = 0;
    if (mission.promotion && mission.promotion.boostUntil > new Date()) {
      const typeMultiplier =
        mission.promotion.type === "sponsored"
          ? 60
          : mission.promotion.type === "featured"
            ? 45
            : mission.promotion.type === "priority_queue"
              ? 35
              : 20;
      const weight = mission.promotion.weight ?? 1.0;
      promotionScore = Math.round(mission.promotion.boostCoins * typeMultiplier * weight);
    }

    // 2. Freshness & Urgency Scores
    const ageHours = Math.max(0, (Date.now() - mission.createdAt.getTime()) / (1000 * 3600));
    const freshnessScore = Math.max(0, 100 - ageHours * 2);
    const timeUntilExpiryHours = Math.max(
      0,
      (mission.expiresAt.getTime() - Date.now()) / (1000 * 3600),
    );
    const urgencyScore = timeUntilExpiryHours < 24 ? 50 + (24 - timeUntilExpiryHours) * 2 : 10;

    // 3. Bounty Score
    const bountyScore = Math.min(200, Math.round(mission.bountyAmountCents / 100));

    // 4. Category & Regional Affinity Scores
    const catRep = scout.categoryReputations.find((c) => c.category === mission.category);
    const categoryAffinityScore = catRep ? catRep.categoryTrustScore * 2 + catRep.level * 5 : 0;

    // 5. Scout Online & Workload Fit
    const onlineBonus =
      scout.onlineActivityStatus === "online" ? 25 : scout.onlineActivityStatus === "idle" ? 10 : 0;
    const workloadPenalty = scout.currentWorkload * 8;
    const scoutFitScore = Math.max(0, scout.overallTrust + onlineBonus - workloadPenalty);

    // 6. Distance Penalty
    const distancePenalty = distanceKm * 3;

    const totalScore = Math.max(
      0,
      Math.round(
        promotionScore +
          freshnessScore +
          urgencyScore +
          bountyScore +
          categoryAffinityScore +
          scoutFitScore -
          distancePenalty,
      ),
    );

    return {
      missionId: mission.missionId,
      score: totalScore,
      promotionScore,
      urgencyScore,
      freshnessScore,
      distanceKm,
      bountyScore,
      categoryAffinityScore,
      scoutFitScore,
    };
  }

  public static rankMissionsForScout(
    missions: MissionRankingInput[],
    scout: ScoutRankingProfile,
  ): RankedMissionResult[] {
    return missions
      .map((m) => this.calculateMissionScore(m, scout))
      .sort((a, b) => b.score - a.score);
  }

  public static getOpportunityFeed(
    missions: MissionRankingInput[],
    scout: ScoutRankingProfile,
    limit = 10,
  ): RankedMissionResult[] {
    return this.rankMissionsForScout(missions, scout).slice(0, limit);
  }
}
