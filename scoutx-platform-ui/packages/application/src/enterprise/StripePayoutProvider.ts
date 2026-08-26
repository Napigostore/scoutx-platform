import type { PayoutProvider, PayoutRequestOptions, PayoutResponse } from "./PayoutProvider";

export interface StripePayoutConfig {
  readonly apiKey?: string;
  readonly fetchFn?: typeof fetch;
}

export class StripePayoutProvider implements PayoutProvider {
  private readonly config: StripePayoutConfig;

  constructor(config?: StripePayoutConfig) {
    this.config = config ?? {};
  }

  private getApiKey(): string | undefined {
    return this.config.apiKey || process.env.STRIPE_SECRET_KEY;
  }

  async processPayout(options: PayoutRequestOptions): Promise<PayoutResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        "Stripe secret key is required for payout processing (STRIPE_SECRET_KEY missing)",
      );
    }

    const destinationAccountId =
      options.destinationAccountId || options.metadata?.stripeConnectAccountId;
    if (!destinationAccountId) {
      throw new Error("Scout Stripe Connect account ID is required for payout processing");
    }

    const connectStatus = options.metadata?.stripeConnectStatus;
    if (connectStatus && connectStatus !== "ACTIVE") {
      throw new Error("Scout Stripe Connect account is not active for payouts");
    }

    if (options.amountCents <= 0) {
      throw new Error("Payout amount must be a positive integer");
    }

    const fetchFn = this.config.fetchFn || globalThis.fetch;
    if (!fetchFn) {
      throw new Error("Fetch implementation is unavailable");
    }

    const params = new URLSearchParams();
    params.append("amount", options.amountCents.toString());
    params.append("currency", (options.currency || "usd").toLowerCase());
    params.append("destination", destinationAccountId);
    params.append("metadata[withdrawalRequestId]", options.withdrawalRequestId);
    params.append("metadata[userId]", options.userId);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const response = await fetchFn("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers,
      body: params.toString(),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      error?: { message: string };
    };

    if (!response.ok || !data.id) {
      const errorMsg =
        data.error?.message || `Stripe transfer failed with status ${response.status}`;
      return {
        payoutId: options.withdrawalRequestId,
        providerReference: null,
        status: "FAILED",
        errorMessage: errorMsg,
        rawResponse: data as Record<string, unknown>,
      };
    }

    return {
      payoutId: options.withdrawalRequestId,
      providerReference: data.id,
      status: "PROCESSING",
      rawResponse: data as Record<string, unknown>,
    };
  }

  async getPayoutStatus(providerReference: string): Promise<PayoutResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        "Stripe secret key is required for payout status query (STRIPE_SECRET_KEY missing)",
      );
    }

    const fetchFn = this.config.fetchFn || globalThis.fetch;
    if (!fetchFn) {
      throw new Error("Fetch implementation is unavailable");
    }

    const response = await fetchFn(`https://api.stripe.com/v1/transfers/${providerReference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      reversed?: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.id) {
      const errorMsg =
        data.error?.message || `Stripe transfer status check failed with status ${response.status}`;
      return {
        payoutId: providerReference,
        providerReference,
        status: "FAILED",
        errorMessage: errorMsg,
        rawResponse: data as Record<string, unknown>,
      };
    }

    return {
      payoutId: providerReference,
      providerReference: data.id,
      status: data.reversed ? "FAILED" : "COMPLETED",
      rawResponse: data as Record<string, unknown>,
    };
  }
}
