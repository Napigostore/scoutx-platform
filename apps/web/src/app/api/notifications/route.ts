import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

async function resolveUser(principal: { id: string; email: string }) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
  let user = isUuid ? await prisma.user.findUnique({ where: { id: principal.id } }) : null;
  if (!user && principal.email) user = await prisma.user.findUnique({ where: { email: principal.email } });
  return user;
}

export async function GET(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await resolveUser(principal);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: Request) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await resolveUser(principal);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { ids?: string[]; all?: boolean };
  if (body.all) {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  } else if (body.ids?.length) {
    await prisma.notification.updateMany({ where: { id: { in: body.ids }, userId: user.id }, data: { read: true } });
  }
  return NextResponse.json({ success: true });
}