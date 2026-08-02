import {
  SXCoin,
  type UserWallet,
  type CoinLedgerRecord,
  type CoinTransactionType,
} from "./CoinEconomyFoundation";
import type { AuditLogger } from "@scoutx/infrastructure";

/* ─── 6. Rate Limit Foundation ─── */

export class ActionRateLimiter {
  private requestHistory: Map<string, number[]> = new Map();

  public isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (this.requestHistory.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= limit) {
      return true;
    }

    timestamps.push(now);
    this.requestHistory.set(key, timestamps);
    return false;
  }
}

/* ─── 5. Suspicious Activity Foundation ─── */

export type SuspiciousActivityType =
  | "REPEATED_FAILED_TRANSACTION"
  | "UNUSUAL_WALLET_CHANGE"
  | "DUPLICATE_PAYMENT_ATTEMPT"
  | "EXCESSIVE_REQUEST_RATE";

export interface SuspiciousActivityAlert {
  alertId: string;
  userId: string;
  type: SuspiciousActivityType;
  details: Record<string, unknown>;
  timestamp: Date;
}

/* ─── Financial Security Guard ─── */

export interface TransactionSecurityContext {
  userId: string;
  action:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "ESCROW_LOCK"
    | "ESCROW_RELEASE"
    | "PAYOUT"
    | "BOOST_PURCHASE"
    | "REFUND";
  amountCents: number;
  idempotencyKey: string;
  ipAddress?: string;
}

export class FinancialSecurityGuard {
  private processedIdempotencyKeys: Set<string> = new Set();
  private pendingWithdrawals: Set<string> = new Set();
  private rateLimiter = new ActionRateLimiter();
  private suspiciousAlerts: SuspiciousActivityAlert[] = [];

  constructor(
    private readonly auditLogger: AuditLogger,
    private readonly walletProvider: (userId: string) => UserWallet,
  ) {}

  /**
   * Enforces server-side financial security:
   * 1. Idempotency validation
   * 2. Server-side balance verification (never trust client balance)
   * 3. Ownership & Authorization validation
   * 4. Double-withdrawal prevention
   * 5. Rate limiting & Suspicious activity detection
   */
  public executeSecureTransaction(
    context: TransactionSecurityContext,
    transactionType: CoinTransactionType,
    referenceId: string,
    executorUserId: string,
  ): CoinLedgerRecord {
    // 1. Rate Limiting Check (Max 10 financial transactions per 60 seconds per user)
    const rateLimitKey = `fin_rate_${context.userId}`;
    if (this.rateLimiter.isRateLimited(rateLimitKey, 10, 60_000)) {
      this.recordSuspiciousActivity(context.userId, "EXCESSIVE_REQUEST_RATE", { context });
      throw new Error("Financial operation rate limit exceeded");
    }

    // 2. Validate ownership & authorization
    if (context.userId !== executorUserId) {
      this.recordSuspiciousActivity(context.userId, "UNUSUAL_WALLET_CHANGE", {
        reason: "Unauthorized financial spending attempt across users",
        executorUserId,
      });
      this.auditLogger.log("admin_action", executorUserId, {
        severity: "CRITICAL",
        reason: "Unauthorized financial spending attempt across users",
        targetUserId: context.userId,
        context,
      });
      throw new Error("Unauthorized: Cannot modify financial state for another user");
    }

    // 3. Idempotency protection (Prevent duplicate payment execution)
    if (this.processedIdempotencyKeys.has(context.idempotencyKey)) {
      this.recordSuspiciousActivity(context.userId, "DUPLICATE_PAYMENT_ATTEMPT", {
        idempotencyKey: context.idempotencyKey,
      });
      this.auditLogger.log("admin_action", executorUserId, {
        severity: "WARN",
        reason: "Duplicate financial transaction blocked via idempotency key",
        idempotencyKey: context.idempotencyKey,
      });
      throw new Error("Duplicate transaction attempt detected");
    }

    const wallet = this.walletProvider(context.userId);
    const amountCoins = SXCoin.fromUSD(context.amountCents / 100);

    // 4. Double-withdrawal & Debit validation
    if (
      context.action === "WITHDRAWAL" ||
      context.action === "ESCROW_LOCK" ||
      context.action === "PAYOUT" ||
      context.action === "BOOST_PURCHASE" ||
      context.action === "REFUND"
    ) {
      const lockKey = `${context.userId}_${context.idempotencyKey}`;
      if (this.pendingWithdrawals.has(lockKey)) {
        throw new Error("Concurrent withdrawal or escrow lock in progress");
      }

      this.pendingWithdrawals.add(lockKey);

      try {
        // Server-side balance check (never trust client)
        const serverBalance = wallet.getBalance();
        if (serverBalance.amount < amountCoins.amount) {
          this.recordSuspiciousActivity(context.userId, "REPEATED_FAILED_TRANSACTION", {
            reason: "Insufficient server-side balance for transaction",
            attemptedCoins: amountCoins.amount,
            serverCoins: serverBalance.amount,
          });
          this.auditLogger.log("coin_change", context.userId, {
            severity: "WARN",
            reason: "Insufficient server-side balance for transaction",
            attemptedCoins: amountCoins.amount,
            serverCoins: serverBalance.amount,
          });
          throw new Error("Insufficient server-side balance");
        }

        const record = wallet.debit(amountCoins, transactionType, referenceId);
        this.processedIdempotencyKeys.add(context.idempotencyKey);

        this.auditLogger.log("coin_change", context.userId, {
          action: context.action,
          amountCents: context.amountCents,
          referenceId,
          transactionId: record.transactionId,
        });

        return record;
      } finally {
        this.pendingWithdrawals.delete(lockKey);
      }
    }

    // 5. Credit / Deposit Flow
    const record = wallet.credit(amountCoins, transactionType, referenceId);
    this.processedIdempotencyKeys.add(context.idempotencyKey);

    this.auditLogger.log("coin_change", context.userId, {
      action: context.action,
      amountCents: context.amountCents,
      referenceId,
      transactionId: record.transactionId,
    });

    return record;
  }

  private recordSuspiciousActivity(
    userId: string,
    type: SuspiciousActivityType,
    details: Record<string, unknown>,
  ): void {
    const alert: SuspiciousActivityAlert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type,
      details,
      timestamp: new Date(),
    };
    this.suspiciousAlerts.push(alert);
  }

  public getSuspiciousAlerts(): readonly SuspiciousActivityAlert[] {
    return Object.freeze([...this.suspiciousAlerts]);
  }
}
