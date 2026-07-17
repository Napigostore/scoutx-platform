export class BackpressureError extends Error {
  constructor(message = "Concurrency limit reached. Request rejected.") {
    super(message);
    this.name = "BackpressureError";
  }
}

export class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(private maxConcurrency: number) {
    if (maxConcurrency <= 0) {
      throw new Error("Concurrency limit must be greater than 0");
    }
    this.permits = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

export class ConcurrencyLimiter {
  private semaphore: Semaphore;

  constructor(maxConcurrency: number) {
    this.semaphore = new Semaphore(maxConcurrency);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    try {
      return await operation();
    } finally {
      this.semaphore.release();
    }
  }
}
