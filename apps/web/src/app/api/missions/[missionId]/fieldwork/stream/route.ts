/**
 * GET /api/missions/[missionId]/fieldwork/stream
 *
 * Server-Sent Events (SSE) endpoint for live fieldwork updates.
 * Emits aggregate-safe data only — no PII, no worker identities.
 *
 * Events emitted:
 *   "init"   — initial snapshot
 *   "update" — periodic heartbeat with counters + quota
 *   "event"  — new FieldworkEvent (type + non-PII metadata)
 *   "done"   — fieldwork completed/expired
 *
 * Polls DB every 5 seconds. No Websocket infra required.
 */
import { getAuthenticatedPrincipal } from "@/lib/server-auth";
import { getFieldworkStats, getFieldworkQuotas } from "@/lib/fieldwork-service";
import { prisma } from "@/lib/prisma";

const POLL_INTERVAL_MS = 5000;
const MAX_STREAM_DURATION_MS = 10 * 60 * 1000; // 10 min max stream

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { missionId } = await params;

  const encoder = new TextEncoder();

  function sseMsg(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let lastEventId: string | undefined;

      const enqueue = (event: string, data: unknown) => {
        try {
          controller.enqueue(sseMsg(event, data));
        } catch {
          // client disconnected
        }
      };

      // Send initial snapshot
      try {
        const [stats, quotas] = await Promise.all([
          getFieldworkStats(missionId),
          getFieldworkQuotas(missionId),
        ]);
        enqueue("init", { stats, quotas });
      } catch {
        enqueue("error", { message: "Fieldwork not found" });
        controller.close();
        return;
      }

      // Poll loop
      const interval = setInterval(async () => {
        // Stop if client disconnected or max duration reached
        if (Date.now() - startTime > MAX_STREAM_DURATION_MS) {
          clearInterval(interval);
          enqueue("done", { reason: "STREAM_TIMEOUT" });
          controller.close();
          return;
        }

        try {
          const [stats, quotas, newEvents] = await Promise.all([
            getFieldworkStats(missionId),
            getFieldworkQuotas(missionId),
            prisma.fieldworkEvent.findMany({
              where: {
                missionId,
                ...(lastEventId ? { id: { gt: lastEventId } } : {}),
              },
              orderBy: { createdAt: "asc" },
              take: 20,
              select: {
                id: true,
                type: true,
                metadata: true,
                createdAt: true,
                // workerId intentionally excluded — not PII-safe
              },
            }),
          ]);

          // Update cursor
          if (newEvents.length > 0) {
            const lastEvent = newEvents[newEvents.length - 1];
            if (lastEvent) {
              lastEventId = lastEvent.id;
            }
            for (const ev of newEvents) {
              enqueue("event", { type: ev.type, metadata: ev.metadata, at: ev.createdAt });
            }
          }

          // Periodic aggregate update
          enqueue("update", {
            completion: stats.completion,
            participants: stats.participants,
            budget: stats.budget,
            fieldworkStatus: stats.fieldwork.status,
            quotas,
          });

          // Auto-close on terminal states
          const terminalStates = ["COMPLETED", "EXPIRED", "CANCELLED"];
          if (terminalStates.includes(stats.fieldwork.status)) {
            clearInterval(interval);
            enqueue("done", { reason: stats.fieldwork.status });
            controller.close();
          }
        } catch {
          // DB error — keep alive, don't crash stream
        }
      }, POLL_INTERVAL_MS);

      // Clean up if client disconnects (signal)
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
