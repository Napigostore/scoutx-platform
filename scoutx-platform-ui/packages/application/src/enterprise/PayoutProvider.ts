/* ─── Outbound Worker Payout Abstraction ─── */

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface PayoutRequestOptions {
  readonly withdrawalRequestId: string;
  readonly userId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly idempotencyKey: string;
  readonly destinationAccountId?: string;
  readonly metadata?: Record<string, string>;
}

export interface PayoutResponse {
  readonly payoutId: string;
  readonly providerReference: string | null;
  readonly status: PayoutStatus;
  readonly rawResponse?: Record<string, unknown>;
  readonly errorMessage?: string;
}

export interface PayoutProvider {
  /**
   * Dispatches an outbound worker payout transfer request to the external payment gateway.
   * Must pass idempotencyKey to prevent duplicate money movement.
   */
  processPayout(options: PayoutRequestOptions): Promise<PayoutResponse>;

  /**
   * Reconciles or queries current status of an outbound transfer from external provider.
   */
  getPayoutStatus(providerReference: string): Promise<PayoutResponse>;
}
