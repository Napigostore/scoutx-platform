import type { PayoutProvider, PayoutRequestOptions, PayoutResponse } from "./PayoutProvider";

export interface StripePayoutConfig {
  readonly apiKey?: string;
  readonly mockMode?: boolean;
}

export class StripePayoutProvider implements PayoutProvider {
  private readonly config: StripePayoutConfig;

  constructor(config?: StripePayoutConfig) {
    this.config = config ?? { mockMode: true };
  }

  async processPayout(options: PayoutRequestOptions): Promise<PayoutResponse> {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !this.config.apiKey) {
      throw new Error(
        "Stripe live payouts disabled. Configure live Stripe Connect credentials to enable real transfers in production.",
      );
    }

    // Development / Mock boundary: Zero live credentials required, zero real money movement
    if (this.config.mockMode || !this.config.apiKey) {
      return {
        payoutId: options.withdrawalRequestId,
        providerReference: `mock_tr_${crypto.randomUUID()}`,
        status: "PROCESSING",
        rawResponse: {
          mock: true,
          idempotencyKey: options.idempotencyKey,
          amountCents: options.amountCents,
          currency: options.currency,
        },
      };
    }

    // Production boundary safety check
    throw new Error(
      "Stripe live payouts disabled. Configure live Stripe Connect credentials to enable real transfers.",
    );
  }

  async getPayoutStatus(providerReference: string): Promise<PayoutResponse> {
    if (this.config.mockMode || !this.config.apiKey) {
      return {
        payoutId: providerReference,
        providerReference,
        status: "COMPLETED",
        rawResponse: { mock: true },
      };
    }

    throw new Error("Stripe live payouts disabled.");
  }
}
