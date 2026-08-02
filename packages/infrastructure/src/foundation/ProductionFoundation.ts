import { requireEnv } from "@scoutx/auth";

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
    const env = (raw.NODE_ENV as AppConfig["env"]) || "development";
    const databaseUrl =
      raw.DATABASE_URL ||
      (env === "production"
        ? requireEnv("DATABASE_URL")
        : "postgresql://localhost:5432/fiwokan_dev");
    const jwtSecret =
      raw.JWT_SECRET ||
      (env === "production" ? requireEnv("JWT_SECRET") : "dev_jwt_secret_key_12345");
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
