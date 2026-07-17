export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void;
  child(context: Record<string, any>): Logger;
}

export class ConsoleLogger implements Logger {
  constructor(
    protected context: Record<string, any> = {},
    protected minLevel: "debug" | "info" | "warn" | "error" = "info",
  ) {}

  protected shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.minLevel];
  }

  protected sanitize(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ["password", "token", "secret", "authorization"];
    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }
    return sanitized;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("debug")) return;
    console.debug(
      JSON.stringify({
        level: "debug",
        message,
        ...this.sanitize({ ...this.context, ...context }),
      }),
    );
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("info")) return;
    console.info(
      JSON.stringify({ level: "info", message, ...this.sanitize({ ...this.context, ...context }) }),
    );
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("warn")) return;
    console.warn(
      JSON.stringify({ level: "warn", message, ...this.sanitize({ ...this.context, ...context }) }),
    );
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    if (!this.shouldLog("error")) return;
    const errObj =
      error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    console.error(
      JSON.stringify({
        level: "error",
        message,
        ...errObj,
        ...this.sanitize({ ...this.context, ...context }),
      }),
    );
  }

  child(context: Record<string, any>): Logger {
    return new ConsoleLogger({ ...this.context, ...context }, this.minLevel);
  }
}

export class StructuredLogger extends ConsoleLogger {
  constructor(
    context: Record<string, any> = {},
    minLevel: "debug" | "info" | "warn" | "error" = "info",
  ) {
    super(context, minLevel);
  }
}
