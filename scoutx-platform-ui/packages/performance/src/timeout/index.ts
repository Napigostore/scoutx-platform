export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class ExecutionPolicy {
  static async execute<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options?: {
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const controller = new AbortController();
    const signal = controller.signal;

    let timeoutId: NodeJS.Timeout | null = null;

    const operationPromise = operation(signal);

    if (options?.signal) {
      if (options.signal.aborted) {
        controller.abort();
        throw options.signal.reason || new Error("Operation aborted");
      }
      options.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }

    if (options?.timeoutMs && options.timeoutMs > 0) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new TimeoutError(`Operation timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
      });

      try {
        const result = await Promise.race([operationPromise, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        return result;
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        throw err;
      }
    }

    return operationPromise;
  }
}
