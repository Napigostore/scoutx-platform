import createHmac from "node:crypto";
import type {
  PaymentProvider,
  PaymentTransaction,
  PaymentResult,
} from "./PaymentGatewayFoundation";

export interface MoMoConfig {
  readonly partnerCode?: string;
  readonly accessKey?: string;
  readonly secretKey?: string;
  readonly endpoint?: string;
  readonly redirectUrl?: string;
  readonly ipnUrl?: string;
}

export interface MoMoPaymentRequestInput {
  readonly orderId: string;
  readonly requestId: string;
  readonly amount: number;
  readonly orderInfo: string;
  readonly redirectUrl: string;
  readonly ipnUrl: string;
  readonly extraData: string;
}

export class MoMoPaymentProvider implements PaymentProvider {
  private readonly config: MoMoConfig;

  constructor(config?: MoMoConfig) {
    this.config = config ?? {};
  }

  /**
   * Generates HMAC SHA256 signature for MoMo Create Payment Request
   */
  public generateCreateSignature(input: MoMoPaymentRequestInput): string {
    const partnerCode = this.config.partnerCode || process.env.MOMO_PARTNER_CODE || "";
    const accessKey = this.config.accessKey || process.env.MOMO_ACCESS_KEY || "";
    const secretKey = this.config.secretKey || process.env.MOMO_SECRET_KEY || "";
    const requestType = "captureWallet";

    const rawSignature = `accessKey=${accessKey}&amount=${input.amount}&extraData=${input.extraData}&ipnUrl=${input.ipnUrl}&orderId=${input.orderId}&orderInfo=${input.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${input.redirectUrl}&requestId=${input.requestId}&requestType=${requestType}`;

    return createHmac.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
  }

  /**
   * Verifies HMAC SHA256 signature for MoMo IPN Webhook Payload
   */
  public verifyIpnSignature(payload: Record<string, unknown>): boolean {
    const secretKey = this.config.secretKey || process.env.MOMO_SECRET_KEY;
    const accessKey = this.config.accessKey || process.env.MOMO_ACCESS_KEY;
    if (!secretKey || !accessKey) return false;

    const accessKeyVal = String(accessKey);
    const amountVal = String(payload.amount ?? "");
    const extraDataVal = String(payload.extraData ?? "");
    const messageVal = String(payload.message ?? "");
    const orderIdVal = String(payload.orderId ?? "");
    const orderInfoVal = String(payload.orderInfo ?? "");
    const orderTypeVal = String(payload.orderType ?? "");
    const partnerCodeVal = String(payload.partnerCode ?? "");
    const payTypeVal = String(payload.payType ?? "");
    const requestIdVal = String(payload.requestId ?? "");
    const responseTimeVal = String(payload.responseTime ?? "");
    const resultCodeVal = String(payload.resultCode ?? "");
    const transIdVal = String(payload.transId ?? "");

    const rawSignature = `accessKey=${accessKeyVal}&amount=${amountVal}&extraData=${extraDataVal}&message=${messageVal}&orderId=${orderIdVal}&orderInfo=${orderInfoVal}&orderType=${orderTypeVal}&partnerCode=${partnerCodeVal}&payType=${payTypeVal}&requestId=${requestIdVal}&responseTime=${responseTimeVal}&resultCode=${resultCodeVal}&transId=${transIdVal}`;

    const expectedSignature = createHmac
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    return expectedSignature === String(payload.signature ?? "");
  }

  async createPayment(
    userId: string,
    amountCents: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentTransaction> {
    const isProd = process.env.NODE_ENV === "production";
    const partnerCode = this.config.partnerCode || process.env.MOMO_PARTNER_CODE;
    const secretKey = this.config.secretKey || process.env.MOMO_SECRET_KEY;

    if (isProd && (!partnerCode || !secretKey)) {
      throw new Error(
        "MoMo credentials (MOMO_PARTNER_CODE, MOMO_SECRET_KEY) are required in production environment.",
      );
    }

    return {
      id: `momo_${referenceId}_${Date.now()}`,
      userId,
      amountCents,
      currency,
      provider: "MOMO",
      status: "PENDING",
      referenceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async confirmPayment(transactionId: string): Promise<PaymentResult> {
    return {
      transactionId,
      status: "COMPLETED",
    };
  }

  async refundPayment(transactionId: string): Promise<PaymentResult> {
    return {
      transactionId,
      status: "REFUNDED",
    };
  }
}
