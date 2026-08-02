export type JobType =
  "notification" | "trust_update" | "coin_update" | "search_indexing" | "statistics" | "analytics";

export interface QueueJob<T = unknown> {
  id: string;
  type: JobType;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export type JobHandler<T = unknown> = (job: QueueJob<T>) => Promise<void>;

export class EventQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private handlers: Map<JobType, JobHandler> = new Map();
  private isProcessing = false;

  public registerHandler(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  public enqueue<T>(type: JobType, payload: T, maxAttempts: number = 3): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job: QueueJob<T> = {
      id,
      type,
      payload,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
      status: "pending",
    };
    this.jobs.set(id, job as QueueJob);
    this.triggerProcessing();
    return id;
  }

  private async triggerProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const job of this.jobs.values()) {
        if (
          job.status === "pending" ||
          (job.status === "failed" && job.attempts < job.maxAttempts)
        ) {
          const handler = this.handlers.get(job.type);
          if (!handler) continue;

          job.status = "processing";
          job.attempts += 1;

          try {
            await handler(job);
            job.status = "completed";
          } catch (err) {
            job.error = err instanceof Error ? err.message : String(err);
            job.status = "failed";
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id);
  }
}
