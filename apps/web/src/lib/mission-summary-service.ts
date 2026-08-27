/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const defaultIncludeRelations = {
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
    orderBy: { createdAt: "desc" as const },
    take: 5,
    select: {
      mediaUrl: true,
      type: true,
      scoutId: true,
      userId: true,
    },
  },
  recipients: {
    select: {
      userId: true,
    },
  },
  submission: {
    select: {
      userId: true,
      scoutId: true,
    },
  },
  timelineEntries: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
    select: {
      id: true,
      actorId: true,
      eventType: true,
      summary: true,
      metadata: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      evidence: true,
    },
  },
} as const;

type MissionWithRelations = Prisma.MissionGetPayload<{
  include: typeof defaultIncludeRelations;
}>;

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
  participantCount: number;
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
  q?: string;
  query?: string;
  sort?:
    | "recommended"
    | "popular"
    | "newest"
    | "highest_bounty"
    | "created_at_desc"
    | "last_activity_desc"
    | string;
}

export async function fetchRequesterMissionsSummary(
  requesterUserId?: string | null,
  params: PaginationParams = {},
  currentUserId?: string | null,
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};
  if (requesterUserId) {
    whereClause.requesterId = requesterUserId;
  }

  if (params.status && params.status !== "ALL") {
    if (params.status === "OPEN_MATCHED") {
      whereClause.status = { in: ["OPEN", "MATCHED"] };
    } else {
      whereClause.status = params.status;
    }
  }

  // Enforce Mission Visibility: PUBLIC vs PRIVATE vs INDIVIDUAL
  if (!requesterUserId) {
    if (currentUserId) {
      whereClause.AND = [
        ...(whereClause.AND ? (whereClause.AND as unknown[]) : []),
        {
          OR: [
            {
              AND: [{ visibility: "PUBLIC" }, { status: { not: "DRAFT" } }],
            },
            { requesterId: currentUserId },
            { assignedScout: { userId: currentUserId } },
            { recipients: { some: { userId: currentUserId } } },
          ],
        },
      ];
    } else {
      whereClause.visibility = "PUBLIC";
      whereClause.status =
        params.status && params.status !== "ALL" ? whereClause.status : { not: "DRAFT" };
    }
  } else if (requesterUserId !== currentUserId) {
    // If a specific requester is being queried, but we aren't that requester,
    // don't let us see their DRAFTs either.
    whereClause.AND = [
      ...(whereClause.AND ? (whereClause.AND as unknown[]) : []),
      { status: { not: "DRAFT" } },
    ];
  }

  const queryStr = (params.q || params.query || "").trim();
  if (queryStr) {
    const isCategoryEnum = [
      "STREET_CONDITIONS",
      "VENUE_STATUS",
      "LOCAL_EVENT",
      "PRODUCT_AVAILABILITY",
      "CROWD_DENSITY",
      "WEATHER_ON_SITE",
      "PHOTO_VERIFICATION",
      "GENERAL_OBSERVATION",
    ].includes(queryStr.toUpperCase());

    const orConditions: Record<string, unknown>[] = [
      { title: { contains: queryStr, mode: "insensitive" } },
      { description: { contains: queryStr, mode: "insensitive" } },
      { requiredTags: { hasSome: [queryStr.toLowerCase(), queryStr] } },
    ];

    if (isCategoryEnum) {
      orConditions.push({ category: queryStr.toUpperCase() });
    }

    whereClause.OR = orConditions;
  }

  const sortMode = params.sort || "recommended";

  let rawMissions: MissionWithRelations[] = [];
  let total = 0;

  if (sortMode === "highest_bounty") {
    [total, rawMissions] = await Promise.all([
      prisma.mission.count({ where: whereClause }),
      prisma.mission.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ budgetCents: "desc" as const }, { createdAt: "desc" as const }],
        include: defaultIncludeRelations,
      }),
    ]);
  } else if (sortMode === "newest" || sortMode === "created_at_desc") {
    [total, rawMissions] = await Promise.all([
      prisma.mission.count({ where: whereClause }),
      prisma.mission.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" as const },
        include: defaultIncludeRelations,
      }),
    ]);
  } else if (sortMode === "popular") {
    const allCandidates = await prisma.mission.findMany({
      where: whereClause,
      take: 200,
      orderBy: { createdAt: "desc" as const },
      include: defaultIncludeRelations,
    });

    total = allCandidates.length;

    const rankedCandidates = allCandidates.map((m) => {
      const uniqueScoutIds = new Set<string>();
      if (m.assignedScoutId) uniqueScoutIds.add(m.assignedScoutId);
      if (m.submission?.scoutId) uniqueScoutIds.add(m.submission.scoutId);
      if (Array.isArray(m.evidence)) {
        for (const ev of m.evidence) {
          if (ev.scoutId) uniqueScoutIds.add(ev.scoutId);
        }
      }
      if (Array.isArray(m.timelineEntries)) {
        for (const te of m.timelineEntries) {
          if (te.actorId) uniqueScoutIds.add(te.actorId);
        }
      }
      return {
        mission: m,
        participantCount: uniqueScoutIds.size,
        createdAtTime: new Date(m.createdAt).getTime(),
      };
    });

    rankedCandidates.sort((a, b) => {
      if (b.participantCount !== a.participantCount) {
        return b.participantCount - a.participantCount;
      }
      return b.createdAtTime - a.createdAtTime;
    });

    rawMissions = rankedCandidates.slice(skip, skip + limit).map((rc) => rc.mission);
  } else {
    // "recommended" (deterministic weighted scoring using profile targeting attributes)
    const activeUserId = currentUserId || requesterUserId;
    let userProfile: Record<string, any> | null = null;
    let userPastHistory: { category: string; urgency: string; requiredTags: string[] }[] = [];

    if (activeUserId) {
      const [uProfile, scoutProfile] = await Promise.all([
        prisma.userProfile.findUnique({ where: { userId: activeUserId } }),
        prisma.scoutProfile.findFirst({
          where: { userId: activeUserId },
          select: { id: true },
        }),
      ]);

      userProfile = uProfile as Record<string, any> | null;

      userPastHistory = await prisma.mission.findMany({
        where: {
          OR: [
            { requesterId: activeUserId },
            ...(scoutProfile ? [{ assignedScoutId: scoutProfile.id }] : []),
            { evidence: { some: { userId: activeUserId } } },
            { timelineEntries: { some: { actorId: activeUserId } } },
          ],
        },
        select: {
          category: true,
          urgency: true,
          requiredTags: true,
        },
        take: 50,
      });
    }

    const allCandidates = await prisma.mission.findMany({
      where: whereClause,
      take: 200,
      orderBy: { createdAt: "desc" as const },
      include: defaultIncludeRelations,
    });

    total = allCandidates.length;

    const categoryCounts = new Map<string, number>();
    for (const h of userPastHistory) {
      categoryCounts.set(h.category, (categoryCounts.get(h.category) || 0) + 1);
    }

    const scoredCandidates = allCandidates.map((m) => {
      let score = 0;

      // 1. City / Target Cities Match (25 pts)
      if (userProfile?.livingCity) {
        if (
          m.targetCities?.includes(userProfile.livingCity) ||
          userProfile.missionCities?.includes(userProfile.livingCity)
        ) {
          score += 25;
        }
      }

      // 2. Field / Category Match (20 pts)
      if (userProfile?.preferredMissionTypes?.includes(m.category)) {
        score += 20;
      }

      // 3. Skills / Tags Match (15 pts)
      if (userProfile?.skills && m.requiredTags?.length) {
        const skillMatches = m.requiredTags.filter((t) =>
          userProfile!.skills.some((s: string) => s.toLowerCase() === t.toLowerCase()),
        );
        score += Math.min(15, skillMatches.length * 5);
      }

      // 4. Experience Level Match (10 pts)
      if (m.targetExperienceLevel && m.targetExperienceLevel !== "ANY") {
        if (userProfile?.experienceLevel === m.targetExperienceLevel) {
          score += 10;
        }
      }

      // 5. Language Match (10 pts)
      if (m.targetLanguages?.length && userProfile?.languages?.length) {
        const langMatch = m.targetLanguages.some((l: string) => userProfile!.languages.includes(l));
        if (langMatch) score += 10;
      }

      // 6. Past completed mission similarity (10 pts)
      const pastHistoryCount = categoryCounts.get(m.category) || 0;
      score += Math.min(10, pastHistoryCount * 3);

      return {
        mission: m,
        score,
        createdAtTime: new Date(m.createdAt).getTime(),
      };
    });

    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.createdAtTime - a.createdAtTime;
    });

    rawMissions = scoredCandidates.slice(skip, skip + limit).map((sc) => sc.mission);
  }

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

    const uniqueParticipants = new Set<string>();
    if (m.recipients) {
      for (const r of m.recipients) {
        if (r.userId) uniqueParticipants.add(r.userId);
      }
    }
    if (m.assignedScout) {
      uniqueParticipants.add(m.assignedScout.id);
    }
    if (m.submission?.userId) {
      uniqueParticipants.add(m.submission.userId);
    }
    if (Array.isArray(m.evidence)) {
      for (const ev of m.evidence) {
        if (ev.userId) uniqueParticipants.add(ev.userId);
      }
    }
    const participantCount = uniqueParticipants.size;

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budget: {
        amountCents: m.budgetCents,
        currency: m.currency || "USD",
      },
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt.toISOString(),
      lastActivityAt,
      lastActivitySummary,
      evidenceCount: m._count.evidence,
      participantCount,
      latestMediaUrl:
        latestEv?.mediaUrl ||
        ((latestTimeline?.metadata as Record<string, unknown> | null)?.url as string) ||
        null,
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
            userId: true,
          },
        },
        recipients: {
          select: {
            userId: true,
          },
        },
        submission: {
          select: {
            userId: true,
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

    const uniqueParticipants = new Set<string>();
    if (m.recipients) {
      for (const r of m.recipients) {
        if (r.userId) uniqueParticipants.add(r.userId);
      }
    }
    if (scoutProfile.userId) {
      uniqueParticipants.add(scoutProfile.userId);
    }
    if (m.submission?.userId) {
      uniqueParticipants.add(m.submission.userId);
    }
    if (Array.isArray(m.evidence)) {
      for (const ev of m.evidence) {
        if (ev.userId) uniqueParticipants.add(ev.userId);
      }
    }
    const participantCount = uniqueParticipants.size;

    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budget: {
        amountCents: m.budgetCents,
        currency: m.currency || "USD",
      },
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt.toISOString(),
      lastActivityAt,
      lastActivitySummary,
      evidenceCount: m._count.evidence,
      participantCount,
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
