import { SXCoin } from "./CoinEconomyFoundation";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1. Mission Price Model & Revenue Split ─── */

export interface MissionPrice {
  totalRequesterPriceCents: number;
  scoutPayoutCents: number;
  scoutXFeeCents: number;
  currency: string;
  totalCoinEquivalent: number;
  scoutCoinEquivalent: number;
  feeCoinEquivalent: number;
}

export interface RevenueSplitConfig {
  scoutPayoutPercent: number; // e.g. 75
  scoutXFeePercent: number; // e.g. 25
}

/* ─── 3. Time Value Model & Multipliers ─── */

export type WorkDurationTier = "MICRO" | "LOCAL" | "EXPERT";

export type BoostTier = "NORMAL" | "BOOSTED" | "FEATURED" | "SPONSORED";

export interface PricingCalculationFactors {
  durationTier: WorkDurationTier;
  skillLevel: number; // 1 to 5
  countryCode: string; // e.g. "US", "VN"
  difficultyMultiplier?: number; // e.g. 1.0 to 2.5
  urgencyMultiplier?: number; // e.g. 1.0 to 2.0
  boostTier?: BoostTier;
  category?: string;
}

export interface LocationEconomyFactor {
  countryCode: string;
  baseHourlyUsdCents: number;
}

/* ─── 8. Supply / Demand Hooks ─── */

export interface SupplyDemandHooks {
  activeScoutsCount: number;
  openMissionsCount: number;
  categoryDemandMultiplier: number;
}

/* ─── 2. Pricing Calculation Engine ─── */

export class PricingEngine {
  private static locationFactors: Map<string, LocationEconomyFactor> = new Map([
    ["US", { countryCode: "US", baseHourlyUsdCents: 3000 }], // $30/hr base
    ["VN", { countryCode: "VN", baseHourlyUsdCents: 1000 }], // $10/hr base
    ["DEFAULT", { countryCode: "DEFAULT", baseHourlyUsdCents: 2000 }],
  ]);

  constructor(private readonly eventQueue: EventQueue) {}

  public static getLocationFactor(countryCode: string): LocationEconomyFactor {
    return (
      this.locationFactors.get(countryCode.toUpperCase()) || this.locationFactors.get("DEFAULT")!
    );
  }

  public calculateMissionPrice(factors: PricingCalculationFactors): MissionPrice {
    const locFactor = PricingEngine.getLocationFactor(factors.countryCode);

    // 1. Time Value Base
    let timeMultiplier = 0.5; // MICRO (30 mins equivalent)
    if (factors.durationTier === "LOCAL") timeMultiplier = 2.0; // 2 hours
    if (factors.durationTier === "EXPERT") timeMultiplier = 8.0; // Full day

    const baseCents = Math.round(locFactor.baseHourlyUsdCents * timeMultiplier);

    // 2. Skill Multiplier
    const skillMultiplier = factors.skillLevel >= 5 ? 3.0 : factors.skillLevel >= 3 ? 1.5 : 1.0;

    // 3. Multipliers
    const diff = factors.difficultyMultiplier ?? 1.0;
    const urg = factors.urgencyMultiplier ?? 1.0;

    const baseRequesterCents = Math.round(baseCents * skillMultiplier * diff * urg);

    // 4. Boost Pricing Fees
    let boostFeeCents = 0;
    if (factors.boostTier === "BOOSTED") boostFeeCents = 500; // $5 boost
    if (factors.boostTier === "FEATURED") boostFeeCents = 1500; // $15 featured
    if (factors.boostTier === "SPONSORED") boostFeeCents = 3000; // $30 sponsored

    // 5. Revenue Split Calculation
    const splitPercent = this.getRevenueSplitPercent(factors.durationTier, factors.category);
    const scoutPayoutCents = Math.round(
      (baseRequesterCents * splitPercent.scoutPayoutPercent) / 100,
    );
    const baseFeeCents = baseRequesterCents - scoutPayoutCents;
    const scoutXFeeCents = baseFeeCents + boostFeeCents;
    const totalRequesterPriceCents = baseRequesterCents + boostFeeCents;

    // Sanity Check: No money lost
    if (scoutPayoutCents + scoutXFeeCents !== totalRequesterPriceCents) {
      throw new Error("Revenue split total mismatch");
    }

    const price: MissionPrice = {
      totalRequesterPriceCents,
      scoutPayoutCents,
      scoutXFeeCents,
      currency: "USD",
      totalCoinEquivalent: SXCoin.fromUSD(totalRequesterPriceCents / 100).amount,
      scoutCoinEquivalent: SXCoin.fromUSD(scoutPayoutCents / 100).amount,
      feeCoinEquivalent: SXCoin.fromUSD(scoutXFeeCents / 100).amount,
    };

    this.eventQueue.enqueue("notification", {
      type: "mission.price.calculated",
      price,
    });

    return price;
  }

  private getRevenueSplitPercent(tier: WorkDurationTier, _category?: string): RevenueSplitConfig {
    if (tier === "MICRO") return { scoutPayoutPercent: 80, scoutXFeePercent: 20 };
    if (tier === "EXPERT") return { scoutPayoutPercent: 85, scoutXFeePercent: 15 };
    return { scoutPayoutPercent: 75, scoutXFeePercent: 25 }; // Default 75/25
  }
}
