import { NextResponse } from "next/server";
import { formatCurrency, getRewardUSDByDifficulty } from "@scoutx/application";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbMissions = await prisma.mission.findMany({
      where: { visibility: "PUBLIC" },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        evidence: {
          select: {
            id: true,
            mediaUrl: true,
            scoutId: true,
            createdAt: true,
          },
        },
        submission: {
          select: {
            id: true,
            scoutId: true,
          },
        },
        timelineEntries: {
          select: {
            id: true,
            actorId: true,
            eventType: true,
            metadata: true,
          },
        },
      },
    });

    const getFreshImageUrl = (rawUrl?: string | null, storageKey?: string | null): string | null => {
      if (storageKey && storageKey.trim()) {
        return `/api/evidence/download?key=${encodeURIComponent(storageKey.trim())}`;
      }
      if (!rawUrl || !rawUrl.trim()) return null;

      const url = rawUrl.trim();
      if (url.includes("unsplash.com")) {
        return url;
      }

      const r2KeyMatch = url.match(/(pre-creation-reference\/[^?#]+|evidence\/[^?#]+)/);
      if (r2KeyMatch?.[1]) {
        return `/api/evidence/download?key=${encodeURIComponent(r2KeyMatch[1])}`;
      }

      return url;
    };

    const mappedMissions = dbMissions.map((m) => {
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

      const participantCount = uniqueScoutIds.size;
      const rewardTier = getRewardUSDByDifficulty(m.category, m.urgency);
      const rewardDisplay = formatCurrency(m.budgetCents, m.currency);

      // Find image from timeline entries (reference attachments) or evidence
      let thumbnail: string | null = null;

      for (const te of m.timelineEntries || []) {
        const meta = (te.metadata as Record<string, unknown> | null) || {};
        const metaUrl = (meta.url as string) || null;
        const metaKey = (meta.storageKey as string) || null;
        if (metaUrl || metaKey) {
          const fresh = getFreshImageUrl(metaUrl, metaKey);
          if (fresh) {
            thumbnail = fresh;
            break;
          }
        }
      }

      if (!thumbnail && Array.isArray(m.evidence)) {
        for (const ev of m.evidence) {
          if (ev.mediaUrl) {
            const fresh = getFreshImageUrl(ev.mediaUrl, null);
            if (fresh) {
              thumbnail = fresh;
              break;
            }
          }
        }
      }

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        urgency: m.urgency,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        budgetCents: m.budgetCents,
        currency: m.currency,
        rewardDisplay,
        difficulty: rewardTier.formattedUSD,
        difficultyLabel: rewardTier.label,
        participantCount,
        thumbnailUrl: thumbnail,
        imageUrl: thumbnail,
        referenceImageUrl: thumbnail,
      };
    });

    const latest = [...mappedMissions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const highestPaid = [...mappedMissions]
      .sort((a, b) => b.budgetCents - a.budgetCents)
      .slice(0, 10);

    const mostParticipated = [...mappedMissions]
      .sort((a, b) => b.participantCount - a.participantCount)
      .slice(0, 10);

    return NextResponse.json(
      {
        success: true,
        data: {
          latest,
          highestPaid,
          mostParticipated,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch live home missions" },
      { status: 500 }
    );
  }
}
