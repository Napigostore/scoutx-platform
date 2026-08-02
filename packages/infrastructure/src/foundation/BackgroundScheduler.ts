export type CronJobName =
  | "expire_missions"
  | "release_escrow"
  | "refresh_leaderboard"
  | "refresh_analytics"
  | "cleanup_uploads"
  | "cleanup_notifications";

export interface ScheduledJob {
  name: CronJobName;
  intervalMs: number;
  lastRun?: Date;
  handler: () => Promise<void>;
}

export class BackgroundScheduler {
  private jobs: Map<CronJobName, ScheduledJob> = new Map();
  private timers: Map<CronJobName, NodeJS.Timeout> = new Map();

  public registerJob(name: CronJobName, intervalMs: number, handler: () => Promise<void>): void {
    this.jobs.set(name, {
      name,
      intervalMs,
      handler,
    });
  }

  public start(): void {
    for (const [name, job] of this.jobs.entries()) {
      if (this.timers.has(name)) continue;

      const timer = setInterval(async () => {
        try {
          await job.handler();
          job.lastRun = new Date();
        } catch {
          // log error handled quietly
        }
      }, job.intervalMs);

      this.timers.set(name, timer);
    }
  }

  public stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}
