import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StripePayoutProvider } from "../src/enterprise/StripePayoutProvider";

describe("StripePayoutProvider", () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });

  it("should fail closed if STRIPE_SECRET_KEY is missing", async () => {
    const provider = new StripePayoutProvider();
    await expect(
      provider.processPayout({
        withdrawalRequestId: "req-1",
        userId: "user-1",
        amountCents: 5000,
        currency: "USD",
        idempotencyKey: "idem-1",
        destinationAccountId: "acct_test123",
      }),
    ).rejects.toThrow("Stripe secret key is required for payout processing");
  });

  it("should fail closed if destinationAccountId is missing", async () => {
    const provider = new StripePayoutProvider({ apiKey: "sk_test_mock123" });
    await expect(
      provider.processPayout({
        withdrawalRequestId: "req-1",
        userId: "user-1",
        amountCents: 5000,
        currency: "USD",
        idempotencyKey: "idem-1",
      }),
    ).rejects.toThrow("Scout Stripe Connect account ID is required for payout processing");
  });

  it("should fail closed if stripeConnectStatus is not ACTIVE", async () => {
    const provider = new StripePayoutProvider({ apiKey: "sk_test_mock123" });
    await expect(
      provider.processPayout({
        withdrawalRequestId: "req-1",
        userId: "user-1",
        amountCents: 5000,
        currency: "USD",
        idempotencyKey: "idem-1",
        destinationAccountId: "acct_test123",
        metadata: { stripeConnectStatus: "ONBOARDING" },
      }),
    ).rejects.toThrow("Scout Stripe Connect account is not active for payouts");
  });

  it("should execute Stripe POST /v1/transfers with correct parameters upon valid request", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "tr_test_9999",
        amount: 5000,
        currency: "usd",
        destination: "acct_test123",
      }),
    });

    const provider = new StripePayoutProvider({
      apiKey: "sk_test_mock123",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const res = await provider.processPayout({
      withdrawalRequestId: "req-100",
      userId: "scout-uuid-1",
      amountCents: 5000,
      currency: "USD",
      idempotencyKey: "idempotency-key-abc",
      destinationAccountId: "acct_test123",
      metadata: { stripeConnectStatus: "ACTIVE" },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/transfers");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("Bearer sk_test_mock123");
    expect(init.headers["Idempotency-Key"]).toBe("idempotency-key-abc");

    const bodyParams = new URLSearchParams(init.body);
    expect(bodyParams.get("amount")).toBe("5000");
    expect(bodyParams.get("currency")).toBe("usd");
    expect(bodyParams.get("destination")).toBe("acct_test123");
    expect(bodyParams.get("metadata[withdrawalRequestId]")).toBe("req-100");

    expect(res.status).toBe("PROCESSING");
    expect(res.providerReference).toBe("tr_test_9999");
  });

  it("should query transfer status via GET /v1/transfers/:id", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "tr_test_9999",
        reversed: false,
      }),
    });

    const provider = new StripePayoutProvider({
      apiKey: "sk_test_mock123",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const res = await provider.getPayoutStatus("tr_test_9999");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/transfers/tr_test_9999");
    expect(init.method).toBe("GET");
    expect(res.status).toBe("COMPLETED");
  });
});
