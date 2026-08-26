export interface TraceSpan {
  correlationId: string;
  spanId: string;
  operationName: string;
  startTime: number;
}

export class ObservabilityService {
  private spans: Map<string, TraceSpan> = new Map();
  private slowOperations: Array<{ operation: string; durationMs: number; timestamp: Date }> = [];
  private metrics: Map<string, number> = new Map();

  public startSpan(operationName: string, correlationId?: string): TraceSpan {
    const span: TraceSpan = {
      correlationId:
        correlationId || `corr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      spanId: `span_${Math.random().toString(36).slice(2, 7)}`,
      operationName,
      startTime: Date.now(),
    };
    this.spans.set(span.spanId, span);
    return span;
  }

  public endSpan(span: TraceSpan, slowThresholdMs = 200): number {
    const duration = Date.now() - span.startTime;
    this.spans.delete(span.spanId);
    if (duration > slowThresholdMs) {
      this.slowOperations.push({
        operation: span.operationName,
        durationMs: duration,
        timestamp: new Date(),
      });
    }
    this.recordMetric(`latency:${span.operationName}`, duration);
    return duration;
  }

  public recordMetric(key: string, value: number): void {
    this.metrics.set(key, value);
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries());
  }

  public getSlowOperations(): Array<{ operation: string; durationMs: number; timestamp: Date }> {
    return [...this.slowOperations];
  }
}

/* ─── Resilience Patterns ─── */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastStateChange = Date.now();

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 30_000,
  ) {}

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastStateChange > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("CircuitBreaker is OPEN - execution rejected");
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount += 1;
      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        this.lastStateChange = Date.now();
      }
      throw err;
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

export class ResilienceHelper {
  private idempotencyKeys: Set<string> = new Set();
  private dlq: Array<{ id: string; payload: unknown; error: string; timestamp: Date }> = [];

  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 100,
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (err) {
        attempt += 1;
        if (attempt >= maxAttempts) throw err;
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error("Retry attempts exhausted");
  }

  public isDuplicateEvent(idempotencyKey: string): boolean {
    if (this.idempotencyKeys.has(idempotencyKey)) {
      return true;
    }
    this.idempotencyKeys.add(idempotencyKey);
    return false;
  }

  public sendToDLQ(id: string, payload: unknown, error: string): void {
    this.dlq.push({ id, payload, error, timestamp: new Date() });
  }

  public getDLQ(): Array<{ id: string; payload: unknown; error: string; timestamp: Date }> {
    return [...this.dlq];
  }
}
