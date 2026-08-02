import {
  HumanIntelligenceEngine,
  type ScoutCareerProfile,
  type MissionPrediction,
} from "./HumanIntelligenceEngine";
import type { PricingEngine } from "./DynamicPricingEngine";
import type { BoostMarketplaceEngine } from "./BoostMarketplaceEngine";
import type { AnalyticsEngine } from "../foundation/AnalyticsEngine";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 3. Scout Opportunity Feed Types ─── */

export type OpportunityCategory =
  "HOT_MATCH" | "HIGH_REWARD" | "NEARBY" | "EASY_WIN" | "EXPERT_REQUIRED" | "ENDING_SOON";

export interface OpportunityItem {
  missionId: string;
  category: OpportunityCategory;
  matchScore: number;
  explanation: string;
}

export interface RequesterMissionSuggestion {
  recommendedRewardCents: number;
  expectedCompletionTimeHours: number;
  suitableScoutsCount: number;
  recommendedBoostLevel: "NORMAL" | "BOOSTED" | "FEATURED" | "SPONSORED";
}

export interface MarketHealthMetrics {
  countryCode: string;
  cityName: string;
  category: string;
  activeMissions: number;
  activeScouts: number;
  supplyDemandRatio: number;
  averageRewardCents: number;
  avgCompletionTimeHours: number;
  scoutShortage: boolean;
  categoryGrowthRate: number; // Percentage e.g. 15.5%
}

/* ─── Marketplace Intelligence Engine Class ─── */

export class MarketplaceIntelligenceEngine {
  constructor(
    private readonly pricingEngine: PricingEngine,
    private readonly boostEngine: BoostMarketplaceEngine,
    private readonly analyticsEngine: AnalyticsEngine,
    private readonly eventQueue: EventQueue,
  ) {}

  /**
   * 1. Mission Success Prediction
   */
  public predictMissionSuccess(
    scout: ScoutCareerProfile,
    category: string,
    distanceKm: number,
  ): MissionPrediction {
    const prediction = HumanIntelligenceEngine.predictMissionSuccess(scout, category, distanceKm);
    this.eventQueue.enqueue("notification", {
      type: "mission.prediction.generated",
      scoutId: scout.scoutId,
      prediction,
    });
    return prediction;
  }

  /**
   * 2. Smart Scout Matching with detailed explanations
   */
  public generateSmartMatches(
    candidates: ScoutCareerProfile[],
    category: string,
    missionCoordinates: { latitude: number; longitude: number },
    candidateCoordinates: Map<string, { latitude: number; longitude: number }>,
    topCount: 5 | 10 | 20 = 10,
  ): Array<{ scoutId: string; discoveryScore: number; matchExplanation: string }> {
    const matches = HumanIntelligenceEngine.generateSmartInvitations(
      candidates,
      category,
      missionCoordinates,
      candidateCoordinates,
      topCount,
    );

    this.eventQueue.enqueue("notification", {
      type: "scout.match.generated",
      category,
      matchCount: matches.length,
    });

    return matches;
  }

  /**
   * 3. Scout Opportunity Feed Generation
   */
  public generateOpportunityFeed(
    scout: ScoutCareerProfile,
    missions: Array<{
      missionId: string;
      category: string;
      bountyCents: number;
      distanceKm: number;
      expiresAt: Date;
    }>,
  ): OpportunityItem[] {
    const opportunities: OpportunityItem[] = [];

    for (const m of missions) {
      let category: OpportunityCategory = "HOT_MATCH";
      let matchScore = 80;

      if (m.bountyCents >= 10000) {
        category = "HIGH_REWARD";
        matchScore = 95;
      } else if (m.distanceKm <= 5) {
        category = "NEARBY";
        matchScore = 90;
      } else if ((m.expiresAt.getTime() - Date.now()) / (1000 * 3600) < 12) {
        category = "ENDING_SOON";
        matchScore = 85;
      }

      opportunities.push({
        missionId: m.missionId,
        category,
        matchScore,
        explanation: `${matchScore}% Match • ${category.replace("_", " ")} • ${m.distanceKm} km away`,
      });
    }

    const feed = opportunities.sort((a, b) => b.matchScore - a.matchScore).slice(0, 15);

    this.eventQueue.enqueue("notification", {
      type: "opportunity.feed.generated",
      scoutId: scout.scoutId,
      count: feed.length,
    });

    return feed;
  }

  /**
   * 4. Requester Mission Assistant
   */
  public generateRequesterSuggestions(
    category: string,
    countryCode: string,
    estimatedDurationHours: number,
    availableScoutsCount: number,
  ): RequesterMissionSuggestion {
    const calculatedPrice = this.pricingEngine.calculateMissionPrice({
      durationTier: estimatedDurationHours > 4 ? "EXPERT" : "LOCAL",
      skillLevel: 3,
      countryCode,
      category,
    });

    const recommendedBoostLevel = availableScoutsCount < 3 ? "FEATURED" : "BOOSTED";

    return {
      recommendedRewardCents: calculatedPrice.scoutPayoutCents,
      expectedCompletionTimeHours: estimatedDurationHours,
      suitableScoutsCount: availableScoutsCount,
      recommendedBoostLevel,
    };
  }

  /**
   * 5. Market Health Metrics
   */
  public calculateMarketHealth(
    countryCode: string,
    cityName: string,
    category: string,
    activeMissions: number,
    activeScouts: number,
    averageRewardCents: number,
  ): MarketHealthMetrics {
    const health = HumanIntelligenceEngine.evaluateMarketHealth(
      cityName,
      activeScouts,
      activeMissions,
      averageRewardCents,
    );

    const metrics: MarketHealthMetrics = {
      countryCode,
      cityName,
      category,
      activeMissions,
      activeScouts,
      supplyDemandRatio:
        activeScouts > 0 ? Number((activeMissions / activeScouts).toFixed(2)) : 2.0,
      averageRewardCents,
      avgCompletionTimeHours: 3.5,
      scoutShortage: health.scoutShortageFlag,
      categoryGrowthRate: 18.4,
    };

    this.eventQueue.enqueue("notification", {
      type: "market.health.updated",
      cityName,
      heatScore: health.heatScore,
    });

    return metrics;
  }

  /**
   * 6. Conversion Analytics Triggers
   */
  public trackFunnelEvent(
    eventType:
      | "user.signup"
      | "mission.created"
      | "payment.started"
      | "mission.completed"
      | "payout.completed",
    userId: string,
  ): void {
    this.analyticsEngine.recordRequesterActivity(userId);
    this.eventQueue.enqueue("notification", {
      type: eventType,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
