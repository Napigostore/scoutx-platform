import { prisma } from "@/lib/prisma";

export interface MissionSummaryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  budget: {
    amountCents: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastActivityAt: string;
  lastActivitySummary: string;
  evidenceCount: number;
  latestMediaUrl?: string | null;
  assignedScout?: {
    id: string;
    displayName: string;
  } | null;
  requester?: {
    id: string;
    displayName: string;
  } | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  sort?: "last_activity_desc" | "created_at_desc";
}

export async function fetchRequesterMissionsSummary(
  requesterUserId: string,
  params: PaginationParams = {},
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {
    requesterId: requesterUserId,
  };

  if (params.status && params.status !== "ALL") {
    if (params.status === "OPEN_MATCHED") {
      whereClause.status = { in: ["OPEN", "MATCHED"] };
    } else {
      whereClause.status = params.status;
    }
  }

  const orderBy =
    params.sort === "created_at_desc"
      ? { createdAt: "desc" as const }
      : { updatedAt: "desc" as const };

  const [total, rawMissions] = await Promise.all([
    prisma.mission.count({ where: whereClause }),
    prisma.mission.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
          },
        },
        assignedScout: {
          select: {
            id: true,
            displayName: true,
          },
        },
        evidence: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            mediaUrl: true,
            type: true,
          },
        },
        timelineEntries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            evidence: true,
          },
        },
      },
    }),
  ]);

  // Batch collect actorIds for timeline summary role formatting
  const actorIds = new Set<string>();
  for (const m of rawMissions) {
    if (m.timelineEntries[0]?.actorId) {
      actorIds.add(m.timelineEntries[0].actorId);
    }
  }

  const actorUsers =
    actorIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(actorIds) } },
          select: { id: true, role: true },
        })
      : [];

  const actorRoleMap = new Map(actorUsers.map((u) => [u.id, u.role]));

  const missions: MissionSummaryItem[] = rawMissions.map((m) => {
    const latestTimeline = m.timelineEntries[0];
    const latestEv = m.evidence[0];

    let lastActivitySummary = "Mission created";
    let lastActivityAt = m.updatedAt.toISOString();

    if (latestTimeline) {
      lastActivityAt = latestTimeline.createdAt.toISOString();
      const meta = latestTimeline.metadata as Record<string, unknown> | null;
      const role =
        (meta?.role as string) ||
        (latestTimeline.actorId ? actorRoleMap.get(latestTimeline.actorId) : "REQUESTER");
      const roleLabel = role === "SCOUT" ? "Scout" : "Requester";

      if (latestTimeline.eventType === "EVIDENCE_UPLOADED") {
        if (meta?.category === "ORIGINAL_REQUEST") {
          lastActivitySummary = "Reference media attached";
        } else {
          lastActivitySummary = `${roleLabel} uploaded evidence`;
        }
      } else if (latestTimeline.eventType === "EVIDENCE_REQUESTED") {
        lastActivitySummary = "Requester requested additional evidence";
      } else if (latestTimeline.eventType === "MESSAGE_SENT") {
        lastActivitySummary = `${roleLabel}: ${latestTimeline.summary}`;
      } else {
        lastActivitySummary = latestTimeline.summary;
      }
    }

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budget: {
        amountCents: m.budgetCents,
        currency: m.currency || "VND",
      },
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt.toISOString(),
      lastActivityAt,
      lastActivitySummary,
      evidenceCount: m._count.evidence,
      latestMediaUrl: latestEv?.mediaUrl || null,
      assignedScout: m.assignedScout
        ? {
            id: m.assignedScout.id,
            displayName: m.assignedScout.displayName || "Scout",
          }
        : null,
      requester: {
        id: m.requesterId,
        displayName: m.requester?.email?.split("@")[0] || "Requester",
      },
    };
  });

  return {
    missions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function fetchScoutMissionsSummary(
  scoutUserId: string,
  params: PaginationParams = {},
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // Find scout profile for user
  const scoutProfile = await prisma.scoutProfile.findFirst({
    where: { userId: scoutUserId },
  });

  if (!scoutProfile) {
    return {
      missions: [],
      pagination: { total: 0, page, limit, totalPages: 1 },
    };
  }

  const whereClause: Record<string, unknown> = {
    assignedScoutId: scoutProfile.id,
  };

  if (params.status && params.status !== "ALL") {
    if (params.status === "OPEN_MATCHED") {
      whereClause.status = { in: ["OPEN", "MATCHED"] };
    } else {
      whereClause.status = params.status;
    }
  }

  const orderBy =
    params.sort === "created_at_desc"
      ? { createdAt: "desc" as const }
      : { updatedAt: "desc" as const };

  const [total, rawMissions] = await Promise.all([
    prisma.mission.count({ where: whereClause }),
    prisma.mission.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
          },
        },
        evidence: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            mediaUrl: true,
            type: true,
          },
        },
        timelineEntries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            evidence: true,
          },
        },
      },
    }),
  ]);

  // Batch collect actorIds for timeline summary role formatting
  const actorIds = new Set<string>();
  for (const m of rawMissions) {
    if (m.timelineEntries[0]?.actorId) {
      actorIds.add(m.timelineEntries[0].actorId);
    }
  }

  const actorUsers =
    actorIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(actorIds) } },
          select: { id: true, role: true },
        })
      : [];

  const actorRoleMap = new Map(actorUsers.map((u) => [u.id, u.role]));

  const missions: MissionSummaryItem[] = rawMissions.map((m) => {
    const latestTimeline = m.timelineEntries[0];
    const latestEv = m.evidence[0];

    let lastActivitySummary = "Mission assigned";
    let lastActivityAt = m.updatedAt.toISOString();

    if (latestTimeline) {
      lastActivityAt = latestTimeline.createdAt.toISOString();
      const meta = latestTimeline.metadata as Record<string, unknown> | null;
      const role =
        (meta?.role as string) ||
        (latestTimeline.actorId ? actorRoleMap.get(latestTimeline.actorId) : "REQUESTER");
      const roleLabel = role === "SCOUT" ? "Scout" : "Requester";

      if (latestTimeline.eventType === "EVIDENCE_UPLOADED") {
        if (meta?.category === "ORIGINAL_REQUEST") {
          lastActivitySummary = "Reference media attached";
        } else {
          lastActivitySummary = `${roleLabel} uploaded evidence`;
        }
      } else if (latestTimeline.eventType === "EVIDENCE_REQUESTED") {
        lastActivitySummary = "Requester requested additional evidence";
      } else if (latestTimeline.eventType === "MESSAGE_SENT") {
        lastActivitySummary = `${roleLabel}: ${latestTimeline.summary}`;
      } else {
        lastActivitySummary = latestTimeline.summary;
      }
    }

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budget: {
        amountCents: m.budgetCents,
        currency: m.currency || "VND",
      },
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt.toISOString(),
      lastActivityAt,
      lastActivitySummary,
      evidenceCount: m._count.evidence,
      latestMediaUrl: latestEv?.mediaUrl || null,
      assignedScout: {
        id: scoutProfile.id,
        displayName: scoutProfile.displayName || "You",
      },
      requester: {
        id: m.requesterId,
        displayName: m.requester?.email?.split("@")[0] || "Requester",
      },
    };
  });

  return {
    missions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
