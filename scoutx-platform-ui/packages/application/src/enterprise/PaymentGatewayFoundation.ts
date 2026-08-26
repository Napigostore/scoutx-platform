import { SXCoin, type UserWallet, type CoinLedgerRecord } from "./CoinEconomyFoundation";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1. Payment Provider Abstraction ─── */

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface PaymentTransaction {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  provider: "STRIPE" | "PAYPAL" | "MOMO" | "MOCK_PROVIDER";
  status: PaymentStatus;
  referenceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  transactionId: string;
  status: PaymentStatus;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentProvider {
  createPayment(
    userId: string,
    amountCents: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentTransaction>;
  confirmPayment(transactionId: string): Promise<PaymentResult>;
  refundPayment(transactionId: string): Promise<PaymentResult>;
}

/* ─── 5. Scout Earning Ledger ─── */

export type ScoutEarningStatus = "PENDING" | "AVAILABLE" | "PAID_OUT" | "CANCELLED";

export interface ScoutEarningRecord {
  id: string;
  scoutId: string;
  missionId: string;
  amountCents: number;
  status: ScoutEarningStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── 3 & 4 & 6. Payment Gateway Service ─── */

export class PaymentGatewayService {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private scoutEarnings: Map<string, ScoutEarningRecord[]> = new Map();
  private processedWebhooks: Set<string> = new Set();

  constructor(
    private readonly provider: PaymentProvider,
    private readonly walletProvider: (userId: string) => UserWallet,
    private readonly eventQueue: EventQueue,
  ) {}

  public async initiateCoinPurchase(
    userId: string,
    usdAmount: number,
    referenceId: string,
  ): Promise<PaymentTransaction> {
    const amountCents = Math.round(usdAmount * 100);
    const tx = await this.provider.createPayment(userId, amountCents, "USD", referenceId);
    this.transactions.set(tx.id, tx);

    this.eventQueue.enqueue("notification", {
      type: "payment.started",
      userId,
      transactionId: tx.id,
      amountCents,
    });

    return tx;
  }

  public async confirmCoinPurchase(
    transactionId: string,
    webhookEventId?: string,
  ): Promise<CoinLedgerRecord | null> {
    if (webhookEventId && this.processedWebhooks.has(webhookEventId)) {
      // Idempotency check: duplicate event ignored
      return null;
    }

    const tx = this.transactions.get(transactionId);
    if (!tx || tx.status === "COMPLETED") {
      return null;
    }

    const result = await this.provider.confirmPayment(transactionId);
    tx.status = result.status;
    tx.updatedAt = new Date();

    if (tx.status === "COMPLETED") {
      if (webhookEventId) this.processedWebhooks.add(webhookEventId);

      const coinsToCredit = SXCoin.fromUSD(tx.amountCents / 100);
      const wallet = this.walletProvider(tx.userId);
      const ledgerRecord = wallet.credit(coinsToCredit, "PURCHASE", tx.referenceId);

      this.eventQueue.enqueue("notification", {
        type: "payment.completed",
        userId: tx.userId,
        transactionId: tx.id,
        coinsCredited: coinsToCredit.amount,
      });

      return ledgerRecord;
    }

    return null;
  }

  public async processRefund(transactionId: string): Promise<PaymentTransaction> {
    const tx = this.transactions.get(transactionId);
    if (!tx || tx.status !== "COMPLETED") {
      throw new Error("Transaction cannot be refunded");
    }

    const result = await this.provider.refundPayment(transactionId);
    tx.status = result.status;
    tx.updatedAt = new Date();

    if (tx.status === "REFUNDED") {
      const coinsToDebit = SXCoin.fromUSD(tx.amountCents / 100);
      const wallet = this.walletProvider(tx.userId);
      wallet.debit(coinsToDebit, "REFUND", tx.referenceId);

      this.eventQueue.enqueue("notification", {
        type: "payment.refunded",
        userId: tx.userId,
        transactionId: tx.id,
      });
    }

    return tx;
  }

  public recordMissionScoutEarning(
    scoutId: string,
    missionId: string,
    amountCents: number,
  ): ScoutEarningRecord {
    const record: ScoutEarningRecord = {
      id: `earning_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      scoutId,
      missionId,
      amountCents,
      status: "AVAILABLE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const history = this.scoutEarnings.get(scoutId) || [];
    history.push(record);
    this.scoutEarnings.set(scoutId, history);

    this.eventQueue.enqueue("notification", {
      type: "scout.earning.created",
      scoutId,
      missionId,
      amountCents,
    });

    return record;
  }
}
