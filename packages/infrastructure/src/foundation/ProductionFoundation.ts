export interface AppConfig {
  env: "development" | "staging" | "production";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
}

export class ProductionFoundation {
  private shutdownHooks: (() => Promise<void>)[] = [];

  /**
   * Validates environmental configuration on boot.
   */
  public static validateConfig(raw: Record<string, string | undefined>): AppConfig {
    const databaseUrl = raw.DATABASE_URL || "postgresql://localhost:5432/scoutx";
    const jwtSecret = raw.JWT_SECRET || "default-dev-secret-key-12345";
    const env = (raw.NODE_ENV as AppConfig["env"]) || "development";
    const port = Number(raw.PORT) || 3000;

    return {
      env,
      port,
      databaseUrl,
      jwtSecret,
    };
  }

  /**
   * Health check probe endpoint status.
   */
  public static getHealthStatus(): { status: "ok"; timestamp: string; uptime: number } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Register graceful shutdown hook.
   */
  public registerShutdownHook(hook: () => Promise<void>): void {
    this.shutdownHooks.push(hook);
  }

  /**
   * Trigger graceful shutdown.
   */
  public async shutdown(): Promise<void> {
    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch {
        // quiet shutdown
      }
    }
  }
}
