import type { FinancialSecurityGuard } from "./FinancialSecurityGuard";
import type { PaymentProvider } from "./PaymentGatewayFoundation";
import type { EventQueue } from "../foundation/EventQueue";
import type { AuditLogger } from "@scoutx/infrastructure";

/* ─── 1. Payout Model & Ledger Types ─── */

export type ScoutPayoutStatus =
  "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface ScoutPayout {
  payoutId: string;
  scoutId: string;
  earningReferences: string[];
  amountCents: number;
  currency: string;
  status: ScoutPayoutStatus;
  providerReference?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PayoutLedgerEntry {
  entryId: string;
  payoutId: string;
  scoutId: string;
  amountCents: number;
  previousStatus: ScoutPayoutStatus;
  newStatus: ScoutPayoutStatus;
  timestamp: Date;
  providerReference?: string;
}

/* ─── 2 & 3 & 4. Scout Payout Service ─── */

export class ScoutPayoutEngine {
  private payouts: Map<string, ScoutPayout> = new Map();
  private payoutLedger: PayoutLedgerEntry[] = [];
  private processedPayoutKeys: Set<string> = new Set();

  constructor(
    private readonly provider: PaymentProvider,
    private readonly securityGuard: FinancialSecurityGuard,
    private readonly auditLogger: AuditLogger,
    private readonly eventQueue: EventQueue,
  ) {}

  public async requestPayout(
    scoutId: string,
    executorUserId: string,
    earningReferences: string[],
    amountCents: number,
    idempotencyKey: string,
  ): Promise<ScoutPayout> {
    // 1. Security Authorization & Ownership Check
    if (scoutId !== executorUserId) {
      this.auditLogger.log("admin_action", executorUserId, {
        severity: "CRITICAL",
        reason: "Unauthorized scout payout request for another user",
        targetScoutId: scoutId,
      });
      throw new Error("Unauthorized: Only earning owner can request payout");
    }

    // 2. Idempotency Check (Prevent duplicate payout processing)
    if (this.processedPayoutKeys.has(idempotencyKey)) {
      throw new Error("Duplicate payout request attempt detected");
    }
    this.processedPayoutKeys.add(idempotencyKey);

    if (amountCents <= 0) {
      throw new Error("Payout amount must be greater than zero");
    }

    // 3. Create Payout Model & Ledger Entry
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const payout: ScoutPayout = {
      payoutId,
      scoutId,
      earningReferences,
      amountCents,
      currency: "USD",
      status: "PENDING",
      createdAt: now,
    };

    this.payouts.set(payoutId, payout);
    this.recordLedgerEntry(payout, "PENDING", "PENDING");

    this.eventQueue.enqueue("notification", {
      type: "payout.requested",
      scoutId,
      payoutId,
      amountCents,
    });

    // 4. Process Payout with Provider
    return this.processPayout(payoutId);
  }

  private async processPayout(payoutId: string): Promise<ScoutPayout> {
    const payout = this.payouts.get(payoutId);
    if (!payout || payout.status === "COMPLETED") {
      throw new Error("Payout not found or already completed");
    }

    const prevStatus = payout.status;
    payout.status = "PROCESSING";
    this.recordLedgerEntry(payout, prevStatus, "PROCESSING");

    this.eventQueue.enqueue("notification", {
      type: "payout.processing",
      scoutId: payout.scoutId,
      payoutId,
    });

    try {
      // Use provider abstraction for payout
      const result = await this.provider.confirmPayment(payoutId);
      if (result.status === "COMPLETED") {
        payout.status = "COMPLETED";
        payout.completedAt = new Date();
        payout.providerReference = result.transactionId;
        this.recordLedgerEntry(payout, "PROCESSING", "COMPLETED", result.transactionId);

        this.auditLogger.log("coin_change", payout.scoutId, {
          action: "scout_payout_completed",
          payoutId,
          amountCents: payout.amountCents,
        });

        this.eventQueue.enqueue("notification", {
          type: "payout.completed",
          scoutId: payout.scoutId,
          payoutId,
          amountCents: payout.amountCents,
        });
      } else {
        payout.status = "FAILED";
        this.recordLedgerEntry(payout, "PROCESSING", "FAILED");
        this.eventQueue.enqueue("notification", {
          type: "payout.failed",
          scoutId: payout.scoutId,
          payoutId,
        });
      }
    } catch {
      payout.status = "FAILED";
      this.recordLedgerEntry(payout, "PROCESSING", "FAILED");
      this.eventQueue.enqueue("notification", {
        type: "payout.failed",
        scoutId: payout.scoutId,
        payoutId,
      });
    }

    return payout;
  }

  private recordLedgerEntry(
    payout: ScoutPayout,
    previousStatus: ScoutPayoutStatus,
    newStatus: ScoutPayoutStatus,
    providerReference?: string,
  ): void {
    this.payoutLedger.push({
      entryId: `pledger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payoutId: payout.payoutId,
      scoutId: payout.scoutId,
      amountCents: payout.amountCents,
      previousStatus,
      newStatus,
      timestamp: new Date(),
      providerReference,
    });
  }

  public getPayoutLedger(): readonly PayoutLedgerEntry[] {
    return Object.freeze([...this.payoutLedger]);
  }
}
