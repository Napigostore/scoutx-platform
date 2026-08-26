import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1. ScoutX Coin Value Model ─── */

export class SXCoin {
  public static readonly COINS_PER_USD = 100;

  private constructor(public readonly amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error("SXCoin amount must be a non-negative integer");
    }
  }

  public static fromCoins(amount: number): SXCoin {
    return new SXCoin(Math.round(amount));
  }

  public static fromUSD(usd: number): SXCoin {
    return new SXCoin(Math.round(usd * SXCoin.COINS_PER_USD));
  }

  public toUSD(): number {
    return this.amount / SXCoin.COINS_PER_USD;
  }

  public add(other: SXCoin): SXCoin {
    return new SXCoin(this.amount + other.amount);
  }

  public subtract(other: SXCoin): SXCoin {
    if (this.amount < other.amount) {
      throw new Error("Insufficient SXCoin balance");
    }
    return new SXCoin(this.amount - other.amount);
  }
}

/* ─── 3. Coin Ledger Types ─── */

export type CoinTransactionType =
  | "WELCOME_BONUS"
  | "PURCHASE"
  | "MISSION_PAYMENT"
  | "SCOUT_REWARD"
  | "BOOST_PAYMENT"
  | "REFUND"
  | "ADJUSTMENT";

export interface CoinLedgerRecord {
  transactionId: string;
  userId: string;
  amountCoins: number;
  type: CoinTransactionType;
  timestamp: Date;
  referenceId: string;
}

/* ─── 2. User Wallet & Ledger Domain ─── */

export class UserWallet {
  private ledger: CoinLedgerRecord[] = [];
  private welcomeBonusClaimed = false;

  constructor(public readonly userId: string) {}

  public getBalance(): SXCoin {
    const total = this.ledger.reduce((acc, record) => acc + record.amountCoins, 0);
    return SXCoin.fromCoins(Math.max(0, total));
  }

  public credit(amount: SXCoin, type: CoinTransactionType, referenceId: string): CoinLedgerRecord {
    const record: CoinLedgerRecord = {
      transactionId: `tx_coin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: this.userId,
      amountCoins: amount.amount,
      type,
      timestamp: new Date(),
      referenceId,
    };
    this.ledger.push(record);
    return record;
  }

  public debit(amount: SXCoin, type: CoinTransactionType, referenceId: string): CoinLedgerRecord {
    const currentBalance = this.getBalance();
    currentBalance.subtract(amount); // Throws if insufficient balance

    const record: CoinLedgerRecord = {
      transactionId: `tx_coin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: this.userId,
      amountCoins: -amount.amount,
      type,
      timestamp: new Date(),
      referenceId,
    };
    this.ledger.push(record);
    return record;
  }

  public claimWelcomeBonus(): CoinLedgerRecord {
    if (this.welcomeBonusClaimed) {
      throw new Error("Welcome bonus already claimed");
    }
    this.welcomeBonusClaimed = true;
    return this.credit(SXCoin.fromCoins(500), "WELCOME_BONUS", `welcome_${this.userId}`);
  }

  public getHistory(): readonly CoinLedgerRecord[] {
    return Object.freeze([...this.ledger]);
  }
}

/* ─── 5. Mission Cost Abstraction ─── */

export interface MissionCostFactors {
  baseRewardUsd: number;
  difficultyMultiplier?: number;
  urgencyMultiplier?: number;
  boostTier?: "NORMAL" | "BOOSTED" | "FEATURED" | "SPONSORED";
}

export class MissionCostCalculator {
  public static calculateMissionCost(factors: MissionCostFactors): SXCoin {
    const baseCoins = SXCoin.fromUSD(factors.baseRewardUsd).amount;
    const diff = factors.difficultyMultiplier ?? 1.0;
    const urg = factors.urgencyMultiplier ?? 1.0;

    let boostCoins = 0;
    if (factors.boostTier === "BOOSTED") boostCoins = 500;
    if (factors.boostTier === "FEATURED") boostCoins = 1500;
    if (factors.boostTier === "SPONSORED") boostCoins = 3000;

    const totalCoins = Math.round(baseCoins * diff * urg) + boostCoins;
    return SXCoin.fromCoins(totalCoins);
  }
}

/* ─── 6 & 7. Coin Service & Event Triggers ─── */

export class CoinEconomyService {
  private wallets: Map<string, UserWallet> = new Map();

  constructor(private readonly eventQueue: EventQueue) {}

  public getOrCreateWallet(userId: string): UserWallet {
    let wallet = this.wallets.get(userId);
    if (!wallet) {
      wallet = new UserWallet(userId);
      this.wallets.set(userId, wallet);
    }
    return wallet;
  }

  public issueWelcomeBonus(userId: string): void {
    const wallet = this.getOrCreateWallet(userId);
    wallet.claimWelcomeBonus();
    this.eventQueue.enqueue("notification", {
      type: "coin.credited",
      userId,
      amount: 500,
      reason: "Welcome Bonus",
    });
  }
}
