import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MoMoPaymentProvider } from "@scoutx/application";

export async function POST(request: Request) {
  try {
    // 1. Authenticate request server-side
    const principal = await authenticate(request);
    if (!principal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read body - only trust missionId
    const body = await request.json();
    const { missionId } = body ?? {};
    if (!missionId) {
      return NextResponse.json({ error: "Mission ID is required" }, { status: 400 });
    }

    // 3. Load mission from database
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // 4. Verify mission ownership
    if (mission.requesterId !== principal.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not the owner of this mission" },
        { status: 403 },
      );
    }

    // 5. Require VND currency
    const cleanCurrency = mission.currency.trim().toUpperCase();
    if (cleanCurrency !== "VND") {
      return NextResponse.json(
        { error: `MoMo checkout requires VND currency. Mission currency is '${cleanCurrency}'` },
        { status: 400 },
      );
    }

    // 6. Validate mission state
    if (mission.status !== "DRAFT" && mission.status !== "OPEN") {
      return NextResponse.json({ error: "Mission is not in a payable status" }, { status: 400 });
    }

    // 7. Authoritative amount
    const amount = mission.budgetCents;

    // 8. Fail-closed production safety check
    const isProd = process.env.NODE_ENV === "production";
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (isProd && (!partnerCode || !secretKey || !accessKey)) {
      return NextResponse.json(
        { error: "MoMo live payments disabled: missing production environment credentials" },
        { status: 500 },
      );
    }

    // 9. Construct MoMo payment payload
    const endpoint =
      process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://fiwokan.com";
    const redirectUrl =
      process.env.MOMO_REDIRECT_URL || `${origin}/missions/${missionId}?checkout=momo_return`;
    const ipnUrl = process.env.MOMO_IPN_URL || `${origin}/api/webhooks/momo`;

    const requestId = `req_${Date.now()}_${crypto.randomUUID()}`;
    const orderId = `ord_${missionId}_${Date.now()}`;
    const orderInfo = `Payment for Mission ${mission.title}`;
    const extraData = `requesterId=${principal.id}&missionId=${mission.id}`;

    const momoProvider = new MoMoPaymentProvider({
      partnerCode: partnerCode || "MOMO_TEST_PARTNER",
      accessKey: accessKey || "MOMO_TEST_ACCESS_KEY",
      secretKey: secretKey || "MOMO_TEST_SECRET_KEY",
    });

    const signature = momoProvider.generateCreateSignature({
      orderId,
      requestId,
      amount,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
    });

    const payload = {
      partnerCode: partnerCode || "MOMO_TEST_PARTNER",
      partnerName: "FIWOKAN",
      storeId: "FIWOKAN_STORE",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      extraData,
      requestType: "captureWallet",
      signature,
    };

    let payUrl = `${endpoint}?orderId=${orderId}`;
    let qrCodeUrl = `${endpoint}/qr?orderId=${orderId}`;

    if (partnerCode && secretKey && accessKey) {
      try {
        const momoRes = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const momoData = await momoRes.json();
        if (momoData?.payUrl) {
          payUrl = momoData.payUrl;
        }
        if (momoData?.qrCodeUrl) {
          qrCodeUrl = momoData.qrCodeUrl;
        }
      } catch (err) {
        console.error("Failed to connect to MoMo gateway:", err);
      }
    }

    return NextResponse.json({
      success: true,
      provider: "MOMO",
      orderId,
      requestId,
      amount,
      currency: "VND",
      payUrl,
      qrCodeUrl,
    });
  } catch (error) {
    console.error("Error creating MoMo checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
