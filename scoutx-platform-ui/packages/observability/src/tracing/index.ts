export interface Span {
  setAttribute(key: string, value: any): this;
  end(): void;
}

export interface Tracer {
  startSpan(name: string, context?: TraceContext): Span;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
}

export class NoOpSpan implements Span {
  setAttribute(): this {
    return this;
  }
  end(): void {}
}

export class NoOpTracer implements Tracer {
  startSpan(): Span {
    return new NoOpSpan();
  }
}

export class OpenTelemetryAdapter implements Tracer {
  startSpan(): Span {
    return new NoOpSpan();
  }
}

export const globalTracer: Tracer = new NoOpTracer();
