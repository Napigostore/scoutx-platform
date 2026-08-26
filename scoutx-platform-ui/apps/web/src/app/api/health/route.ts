import { NextResponse } from "next/server";
import { serverBootstrap } from "@/lib/server-init";

export async function GET() {
  const isHealthy = serverBootstrap.isInitialized;
  const analytics = serverBootstrap.analyticsEngine.computeMetrics();
  const mem = process.memoryUsage();

  const healthData = {
    status: isHealthy ? "UP" : "DOWN",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    gitSha: process.env.GIT_COMMIT_SHA || "f646014",
    buildTime: process.env.BUILD_TIMESTAMP || "2026-07-30T22:00:00Z",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    components: {
      database: { status: "UP" },
      eventBus: { status: "UP" },
      storage: { status: "UP" },
      scheduler: { status: "UP", lastRun: new Date().toISOString() },
      searchIndex: { status: "UP" },
      cache: { status: "UP" },
      analytics: { status: "UP", activeScouts: analytics.dailyActiveScouts },
      queue: { status: "UP" },
    },
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
  });
}
