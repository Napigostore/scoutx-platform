import { NextResponse } from "next/server";
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getUserProfile, updateUserProfile } from "@/lib/user-profile-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    const principal = await getAuthenticatedPrincipal(request);

    let targetUserId = requestedUserId;

    if (!targetUserId) {
      if (!principal) {
        return NextResponse.json({ error: "Authentication required or userId query parameter required" }, { status: 401 });
      }
      // Lookup actual user UUID from principal
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
      const user = isUuid
        ? await prisma.user.findUnique({ where: { id: principal.id } })
        : await prisma.user.findUnique({ where: { email: principal.email } });
      if (!user) {
        return NextResponse.json({ error: "Authenticated user record not found" }, { status: 404 });
      }
      targetUserId = user.id;
    }

    // Determine requester identity
    let requestingUserId: string | null = null;
    let requestingUserRole: string | null = null;
    if (principal) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
      const reqUser = isUuid
        ? await prisma.user.findUnique({ where: { id: principal.id } })
        : await prisma.user.findUnique({ where: { email: principal.email } });
      if (reqUser) {
        requestingUserId = reqUser.id;
        requestingUserRole = reqUser.role;
      }
    }

    const profile = await getUserProfile(targetUserId, requestingUserId, requestingUserRole);

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[PROFILE_GET_ERROR]", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const principal = await getAuthenticatedPrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(principal.id);
    const user = isUuid
      ? await prisma.user.findUnique({ where: { id: principal.id } })
      : await prisma.user.findUnique({ where: { email: principal.email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();

    await updateUserProfile(user.id, body);

    const updatedProfile = await getUserProfile(user.id, user.id, user.role);

    return NextResponse.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[PROFILE_PATCH_ERROR]", err?.message);
    return NextResponse.json({ error: err?.message || "Failed to update profile" }, { status: 500 });
  }
}
