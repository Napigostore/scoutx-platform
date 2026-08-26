import { SXCoin, type UserWallet, type CoinLedgerRecord } from "./CoinEconomyFoundation";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1. Boost Product Model ─── */

export type BoostType = "NORMAL" | "BOOSTED" | "FEATURED" | "SPONSORED" | "EXPERT_MATCH";

export interface BoostProduct {
  id: string;
  type: BoostType;
  name: string;
  costCoins: number;
  durationHours: number;
  priorityLevel: number; // 0 (Normal) to 4 (Expert Match)
  active: boolean;
}

export const BOOST_CATALOG: Record<BoostType, BoostProduct> = {
  NORMAL: {
    id: "boost_normal",
    type: "NORMAL",
    name: "Standard Listing",
    costCoins: 0,
    durationHours: 0,
    priorityLevel: 0,
    active: true,
  },
  BOOSTED: {
    id: "boost_boosted",
    type: "BOOSTED",
    name: "Boosted Exposure",
    costCoins: 500,
    durationHours: 24,
    priorityLevel: 1,
    active: true,
  },
  FEATURED: {
    id: "boost_featured",
    type: "FEATURED",
    name: "Featured Mission",
    costCoins: 1500,
    durationHours: 48,
    priorityLevel: 2,
    active: true,
  },
  SPONSORED: {
    id: "boost_sponsored",
    type: "SPONSORED",
    name: "Sponsored Badge",
    costCoins: 3000,
    durationHours: 72,
    priorityLevel: 3,
    active: true,
  },
  EXPERT_MATCH: {
    id: "boost_expert",
    type: "EXPERT_MATCH",
    name: "Expert Match Guarantee",
    costCoins: 5000,
    durationHours: 168,
    priorityLevel: 4,
    active: true,
  },
};

/* ─── 3. Mission Promotion State ─── */

export interface MissionPromotionState {
  missionId: string;
  boostType: BoostType;
  startTime: Date;
  expiryTime: Date;
  priorityLevel: number;
  costCoins: number;
}

export interface BoostRevenueRecord {
  recordId: string;
  missionId: string;
  requesterId: string;
  boostType: BoostType;
  amountCoins: number;
  amountUsdEquivalent: number;
  timestamp: Date;
}

/* ─── 2 & 4. Boost Service ─── */

export class BoostMarketplaceEngine {
  private activePromotions: Map<string, MissionPromotionState> = new Map();
  private boostRevenueLedger: BoostRevenueRecord[] = [];

  constructor(
    private readonly walletProvider: (userId: string) => UserWallet,
    private readonly eventQueue: EventQueue,
  ) {}

  public purchaseBoost(
    requesterId: string,
    missionId: string,
    boostType: BoostType,
  ): { promotion: MissionPromotionState; ledgerRecord: CoinLedgerRecord } {
    const product = BOOST_CATALOG[boostType];
    if (!product || !product.active) {
      throw new Error(`Invalid or inactive boost type: ${boostType}`);
    }

    const cost = SXCoin.fromCoins(product.costCoins);
    const wallet = this.walletProvider(requesterId);

    // Deduct SXC from wallet (throws if insufficient balance for non-zero cost)
    let ledgerRecord: CoinLedgerRecord;
    if (product.costCoins > 0) {
      ledgerRecord = wallet.debit(cost, "BOOST_PAYMENT", missionId);
    } else {
      ledgerRecord = {
        transactionId: `tx_free_${Date.now()}`,
        userId: requesterId,
        amountCoins: 0,
        type: "BOOST_PAYMENT",
        timestamp: new Date(),
        referenceId: missionId,
      };
    }

    // Activate mission promotion state
    const now = new Date();
    const expiry = new Date(now.getTime() + product.durationHours * 3600 * 1000);

    const promotion: MissionPromotionState = {
      missionId,
      boostType,
      startTime: now,
      expiryTime: expiry,
      priorityLevel: product.priorityLevel,
      costCoins: product.costCoins,
    };

    this.activePromotions.set(missionId, promotion);

    // Track Boost Revenue separately
    if (product.costCoins > 0) {
      this.boostRevenueLedger.push({
        recordId: `rev_boost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        missionId,
        requesterId,
        boostType,
        amountCoins: product.costCoins,
        amountUsdEquivalent: cost.toUSD(),
        timestamp: now,
      });
    }

    // Emit Events
    this.eventQueue.enqueue("notification", {
      type: "boost.purchased",
      missionId,
      requesterId,
      boostType,
      costCoins: product.costCoins,
    });

    return { promotion, ledgerRecord };
  }

  public getPromotionState(missionId: string): MissionPromotionState | undefined {
    const promo = this.activePromotions.get(missionId);
    if (promo && promo.expiryTime < new Date()) {
      this.eventQueue.enqueue("notification", { type: "boost.expired", missionId });
      this.activePromotions.delete(missionId);
      return undefined;
    }
    return promo;
  }

  public getBoostRevenueLedger(): readonly BoostRevenueRecord[] {
    return Object.freeze([...this.boostRevenueLedger]);
  }
}
