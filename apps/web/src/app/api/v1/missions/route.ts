/* eslint-disable */
import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized: Valid X-API-Key or Bearer token required" },
      { status: 401 },
    );
  }

  const missions = await prisma.mission.findMany({
    where: { requesterId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ missions });
}

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized: Valid X-API-Key or Bearer token required" },
      { status: 401 },
    );
  }

  if (!auth.scopes.includes("write")) {
    return NextResponse.json({ error: "Forbidden: API Key lacks write scope" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, category, budgetCents, latitude, longitude } = body;

  if (!title || !description || !budgetCents) {
    return NextResponse.json(
      { error: "Missing required fields: title, description, budgetCents" },
      { status: 400 },
    );
  }

  try {
    // Find default location or create dummy
    let location = await prisma.location.findFirst();
    if (!location) {
      location = await prisma.location.create({
        data: {
          name: "Default Location",
          city: "Ho Chi Minh City",
          country: "Vietnam",
          countryCode: "VN",
          latitude: latitude || 10.7769,
          longitude: longitude || 106.7009,
          timezone: "Asia/Ho_Chi_Minh",
        },
      });
    }

    const mission = await prisma.mission.create({
      data: {
        title,
        description,
        category: category || "ONLINE_SURVEY",
        budgetCents: Number(budgetCents),
        requesterId: auth.userId,
        locationId: location.id,
        latitude: latitude || 10.7769,
        longitude: longitude || 106.7009,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, mission }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
