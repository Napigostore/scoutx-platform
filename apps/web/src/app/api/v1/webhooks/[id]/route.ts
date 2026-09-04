import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  const subscription = await prisma.webhookSubscription.findUnique({
    where: { id },
  });

  if (!subscription || subscription.userId !== principal.id) {
    return NextResponse.json({ error: "Webhook subscription not found" }, { status: 404 });
  }

  await prisma.webhookSubscription.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Webhook subscription deleted" });
}
