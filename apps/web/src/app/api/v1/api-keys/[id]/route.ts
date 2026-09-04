import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  const keyRecord = await prisma.apiKey.findUnique({
    where: { id },
  });

  if (!keyRecord || keyRecord.userId !== principal.id) {
    return NextResponse.json({ error: "API Key not found" }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revoked: true },
  });

  return NextResponse.json({ success: true, message: "API key revoked successfully" });
}
