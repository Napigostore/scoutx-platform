export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details: Record<string, unknown> = {},
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toPayload(): Record<string, unknown> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        correlationId: this.correlationId,
      },
    };
  }
}

export class GlobalErrorMapper {
  static map(error: unknown, correlationId?: string): AppError {
    if (error instanceof AppError) {
      return correlationId
        ? new AppError(error.code, error.message, error.statusCode, error.details, correlationId)
        : error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new AppError("INTERNAL_SERVER_ERROR", message, 500, {}, correlationId);
  }
}
