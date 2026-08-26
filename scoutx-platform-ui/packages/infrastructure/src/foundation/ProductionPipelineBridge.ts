import type { AuditLogger } from "./AuditLogger";
import type { SearchIndexService } from "./SearchIndexService";
import type { RecommendationCacheService } from "./RecommendationCacheService";
import type { BackgroundScheduler } from "./BackgroundScheduler";
import type { ProductionFoundation } from "./ProductionFoundation";

export class ProductionPipelineBridge {
  private isInitialized = false;

  constructor(
    public readonly auditLogger: AuditLogger,
    public readonly searchIndex: SearchIndexService,
    public readonly recommendationCache: RecommendationCacheService,
    public readonly scheduler: BackgroundScheduler,
    public readonly foundation: ProductionFoundation,
  ) {}

  /**
   * Connect background scheduled jobs to cache invalidation, search, and audit tasks.
   */
  public initializePipelineConnections(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    // 1. Expire missions job
    this.scheduler.registerJob("expire_missions", 60_000, async () => {
      this.auditLogger.log("mission_change", "system_scheduler", {
        action: "expire_missions_job_run",
      });
      this.recommendationCache.invalidate("discovery");
    });

    // 2. Release escrow job
    this.scheduler.registerJob("release_escrow", 120_000, async () => {
      this.auditLogger.log("coin_change", "system_scheduler", {
        action: "release_escrow_job_run",
      });
      this.recommendationCache.invalidate("leaderboard");
    });

    // 3. Refresh leaderboard job
    this.scheduler.registerJob("refresh_leaderboard", 300_000, async () => {
      this.recommendationCache.invalidate("leaderboard");
      this.auditLogger.log("admin_action", "system_scheduler", {
        action: "refresh_leaderboard_job_run",
      });
    });

    // 4. Refresh analytics job
    this.scheduler.registerJob("refresh_analytics", 300_000, async () => {
      this.recommendationCache.invalidate("match");
    });

    // 5. Cleanup uploads & notifications
    this.scheduler.registerJob("cleanup_uploads", 600_000, async () => {
      this.auditLogger.log("moderator_action", "system_scheduler", {
        action: "cleanup_uploads_job_run",
      });
    });

    this.scheduler.registerJob("cleanup_notifications", 600_000, async () => {
      // quiet cleanup
    });

    // Start background scheduler
    this.scheduler.start();

    // Register graceful shutdown hook
    this.foundation.registerShutdownHook(async () => {
      this.scheduler.stop();
    });
  }
}
