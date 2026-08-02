/* ─── Global Human Intelligence Engine ─── */

export interface ScoutDNAProfile {
  category: string;
  xp: number;
  skillScore: number;
  trustScore: number;
  accuracyRate: number;
  responseSpeedMinutes: number;
  completionRate: number;
  verificationRate: number;
  confidenceScore: number; // 0-100
}

export interface LocalAuthorityRecord {
  scope: "global" | "country" | "province" | "city" | "district" | "radius";
  locationName: string;
  authorityScore: number; // 0-100
  rank: number;
}

export interface ScoutCareerProfile {
  scoutId: string;
  overallLevel: number;
  totalXp: number;
  totalEarningsCents: number;
  lifetimeMissions: number;
  longestStreakDays: number;
  fastestSolveMinutes: number;
  highestBountyCents: number;
  dnaProfiles: ScoutDNAProfile[];
  authorityRecords: LocalAuthorityRecord[];
}

export interface MissionPrediction {
  successProbabilityPercent: number;
  expectedResponseTimeMinutes: number;
  expectedCompletionTimeHours: number;
  verificationProbabilityPercent: number;
}

export interface LocalMarketHealth {
  cityName: string;
  scoutSupplyCount: number;
  missionDemandCount: number;
  activeScoutsCount: number;
  openMissionsCount: number;
  averageRewardCents: number;
  scoutShortageFlag: boolean;
  categoryShortageFlags: string[];
  heatScore: number; // 0-100
}

export class HumanIntelligenceEngine {
  public static calculateDiscoveryScore(
    dna: ScoutDNAProfile[],
    authority: LocalAuthorityRecord[],
    trustScore: number,
    distanceKm: number,
    isOnline: boolean,
  ): number {
    const avgSkill =
      dna.length > 0 ? dna.reduce((sum, d) => sum + d.skillScore, 0) / dna.length : 50;
    const maxAuthority =
      authority.length > 0 ? Math.max(...authority.map((a) => a.authorityScore)) : 50;
    const onlineBonus = isOnline ? 20 : 0;
    const distancePenalty = distanceKm * 2;

    return Math.max(
      0,
      Math.round(trustScore * 2 + avgSkill + maxAuthority + onlineBonus - distancePenalty),
    );
  }

  public static predictMissionSuccess(
    scout: ScoutCareerProfile,
    category: string,
    distanceKm: number,
  ): MissionPrediction {
    const dna = scout.dnaProfiles.find((d) => d.category === category);
    const categorySkill = dna ? dna.skillScore : 50;
    const accuracy = dna ? dna.accuracyRate : 85;

    const baseProb = (categorySkill + accuracy) / 2;
    const distancePenalty = Math.min(30, distanceKm * 1.5);
    const successProb = Math.max(10, Math.min(99, Math.round(baseProb - distancePenalty)));

    return {
      successProbabilityPercent: successProb,
      expectedResponseTimeMinutes: dna ? dna.responseSpeedMinutes : 30,
      expectedCompletionTimeHours: Math.round(distanceKm > 10 ? 4 : 2),
      verificationProbabilityPercent: Math.min(98, successProb + 5),
    };
  }

  public static generateSmartInvitations(
    candidates: ScoutCareerProfile[],
    category: string,
    missionCoordinates: { latitude: number; longitude: number },
    candidateCoordinates: Map<string, { latitude: number; longitude: number }>,
    limit = 5,
  ): Array<{ scoutId: string; discoveryScore: number; matchExplanation: string }> {
    return candidates
      .map((scout) => {
        const coords = candidateCoordinates.get(scout.scoutId) || { latitude: 0, longitude: 0 };
        const dLat = ((coords.latitude - missionCoordinates.latitude) * Math.PI) / 180;
        const dLon = ((coords.longitude - missionCoordinates.longitude) * Math.PI) / 180;
        const distKm = Math.round(
          6371 *
            2 *
            Math.asin(
              Math.sqrt(
                Math.sin(dLat / 2) ** 2 +
                  Math.cos((missionCoordinates.latitude * Math.PI) / 180) *
                    Math.cos((coords.latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) ** 2,
              ),
            ),
        );

        const score = this.calculateDiscoveryScore(
          scout.dnaProfiles,
          scout.authorityRecords,
          80,
          distKm,
          true,
        );
        const explanation = `${score}% Match • ${category} Expert • ${distKm} km away • Verified Scout`;
        return { scoutId: scout.scoutId, discoveryScore: score, matchExplanation: explanation };
      })
      .sort((a, b) => b.discoveryScore - a.discoveryScore)
      .slice(0, limit);
  }

  public static evaluateMarketHealth(
    cityName: string,
    activeScouts: number,
    openMissions: number,
    averageRewardCents: number,
  ): LocalMarketHealth {
    const supplyDemandRatio = activeScouts > 0 ? openMissions / activeScouts : 2;
    const scoutShortage = supplyDemandRatio > 1.5;
    const heatScore = Math.min(100, Math.round(openMissions * 5 + supplyDemandRatio * 20));

    return {
      cityName,
      scoutSupplyCount: activeScouts,
      missionDemandCount: openMissions,
      activeScoutsCount: activeScouts,
      openMissionsCount: openMissions,
      averageRewardCents,
      scoutShortageFlag: scoutShortage,
      categoryShortageFlags: scoutShortage ? ["Missing Person", "Property Verification"] : [],
      heatScore,
    };
  }
}
