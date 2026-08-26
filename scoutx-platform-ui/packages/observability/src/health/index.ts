export interface HealthStatus {
  status: "UP" | "DOWN";
  details?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  check(): Promise<HealthStatus>;
}

export class DependencyHealthChecker {
  constructor(private checks: HealthCheck[] = []) {}

  async checkAll(): Promise<{ status: "UP" | "DOWN"; details: Record<string, any> }> {
    const details: Record<string, any> = {};
    let overallStatus: "UP" | "DOWN" = "UP";

    for (const check of this.checks) {
      try {
        const res = await check.check();
        details[check.name] = res;
        if (res.status === "DOWN") {
          overallStatus = "DOWN";
        }
      } catch (err) {
        details[check.name] = { status: "DOWN", error: err instanceof Error ? err.message : String(err) };
        overallStatus = "DOWN";
      }
    }

    return { status: overallStatus, details };
  }
}
