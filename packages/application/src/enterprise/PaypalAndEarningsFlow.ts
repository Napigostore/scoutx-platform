import { SXCoin, type UserWallet, type CoinLedgerRecord } from "./CoinEconomyFoundation";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1. PayPal Deposit & Conversion Model ─── */

export interface PaypalDepositPayload {
  paypalOrderId: string;
  paypalPayerId: string;
  usdAmount: number;
  currency: "USD";
  requesterId: string;
}

export interface ScoutEarningsRecord {
  payoutId: string;
  scoutId: string;
  missionId: string;
  earnedCoins: number;
  earnedUsdEquivalent: number;
  status: "LOCKED_IN_ESCROW" | "AVAILABLE_FOR_PAYOUT" | "PAYOUT_COMPLETED";
  completedAt: Date;
}

/* ─── 2. PayPal Deposit & Scout Earnings Service ─── */

export class PaypalAndEarningsService {
  private earningsLedger: Map<string, ScoutEarningsRecord[]> = new Map();

  constructor(
    private readonly eventQueue: EventQueue,
    private readonly walletProvider: (userId: string) => UserWallet,
  ) {}

  /**
   * Requester: USD (PayPal) ➔ ScoutX Coin Wallet
   */
  public handlePaypalDeposit(payload: PaypalDepositPayload): CoinLedgerRecord {
    if (payload.usdAmount <= 0) {
      throw new Error("PayPal deposit amount must be greater than zero");
    }

    const coinValue = SXCoin.fromUSD(payload.usdAmount);
    const wallet = this.walletProvider(payload.requesterId);

    const record = wallet.credit(coinValue, "PURCHASE", payload.paypalOrderId);

    this.eventQueue.enqueue("notification", {
      type: "coin.credited",
      userId: payload.requesterId,
      amount: coinValue.amount,
      reason: `PayPal Deposit (Order ${payload.paypalOrderId})`,
    });

    return record;
  }

  /**
   * Scout: Mission completed ➔ Earnings Ledger ➔ Future Payout Status
   */
  public recordScoutEarnings(
    scoutId: string,
    missionId: string,
    bountyCoins: number,
  ): ScoutEarningsRecord {
    const coinValue = SXCoin.fromCoins(bountyCoins);
    const wallet = this.walletProvider(scoutId);

    // Credit scout wallet
    wallet.credit(coinValue, "SCOUT_REWARD", missionId);

    const earningsRecord: ScoutEarningsRecord = {
      payoutId: `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      scoutId,
      missionId,
      earnedCoins: bountyCoins,
      earnedUsdEquivalent: coinValue.toUSD(),
      status: "AVAILABLE_FOR_PAYOUT",
      completedAt: new Date(),
    };

    const scoutHistory = this.earningsLedger.get(scoutId) || [];
    scoutHistory.push(earningsRecord);
    this.earningsLedger.set(scoutId, scoutHistory);

    this.eventQueue.enqueue("notification", {
      type: "coin.credited",
      userId: scoutId,
      amount: bountyCoins,
      reason: `Mission Reward (${missionId})`,
    });

    return earningsRecord;
  }

  public getScoutEarningsHistory(scoutId: string): readonly ScoutEarningsRecord[] {
    return Object.freeze([...(this.earningsLedger.get(scoutId) || [])]);
  }
}
