import {
  EventQueue,
  AnalyticsEngine,
  ModerationEngine,
  ProductionIntegrationPipeline,
  FeatureFlagService,
} from "@scoutx/application";
import type {
  AuditLogger,
  SearchIndexService,
  RecommendationCacheService,
  BackgroundScheduler,
  ProductionFoundation,
  ProductionPipelineBridge,
  ObservabilityService,
  ResilienceHelper,
} from "@scoutx/infrastructure";
import { productionRuntime } from "@scoutx/infrastructure";

/* ─── Production Server Singleton Instance ─── */

class ServerBootstrap {
  private static instance: ServerBootstrap;

  public readonly eventQueue: EventQueue;
  public readonly analyticsEngine: AnalyticsEngine;
  public readonly moderationEngine: ModerationEngine;
  public readonly auditLogger: AuditLogger;
  public readonly searchIndex: SearchIndexService;
  public readonly cacheService: RecommendationCacheService;
  public readonly scheduler: BackgroundScheduler;
  public readonly foundation: ProductionFoundation;
  public readonly pipeline: ProductionIntegrationPipeline;
  public readonly bridge: ProductionPipelineBridge;
  public readonly featureFlags: FeatureFlagService;
  public readonly observability: ObservabilityService;
  public readonly resilience: ResilienceHelper;
  public isInitialized = false;

  private constructor() {
    this.eventQueue = new EventQueue();
    this.analyticsEngine = new AnalyticsEngine();
    this.moderationEngine = new ModerationEngine();
    this.auditLogger = productionRuntime.auditLogger;
    this.searchIndex = productionRuntime.searchIndex;
    this.cacheService = productionRuntime.cacheService;
    this.scheduler = productionRuntime.scheduler;
    this.foundation = productionRuntime.foundation;
    this.featureFlags = new FeatureFlagService();
    this.observability = productionRuntime.observability;
    this.resilience = productionRuntime.resilience;

    this.pipeline = new ProductionIntegrationPipeline(
      this.eventQueue,
      this.analyticsEngine,
      this.moderationEngine,
    );

    this.bridge = productionRuntime.bridge;

    this.init();
  }

  public static getInstance(): ServerBootstrap {
    if (!ServerBootstrap.instance) {
      ServerBootstrap.instance = new ServerBootstrap();
    }
    return ServerBootstrap.instance;
  }

  private init(): void {
    if (this.isInitialized) return;

    // Initialize production runtime
    void productionRuntime.initialize();

    // Configure default feature flags
    this.featureFlags.setFlag({
      key: "marketplace_v2",
      enabled: true,
      rolloutPercentage: 100,
    });

    // Process graceful shutdown listeners
    if (typeof process !== "undefined") {
      const shutdownHandler = async () => {
        await productionRuntime.shutdown();
      };

      process.once("SIGTERM", shutdownHandler);
      process.once("SIGINT", shutdownHandler);
    }

    this.isInitialized = true;
  }
}

export const serverBootstrap = ServerBootstrap.getInstance();
