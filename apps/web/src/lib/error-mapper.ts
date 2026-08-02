import { NextResponse } from "next/server";

/**
 * Error response with proper HTTP status code mapping.
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Map common error messages to HTTP status codes.
 */
export function mapErrorToStatus(error: Error): number {
  const msg = error.message;

  if (msg.includes("not found")) return 404;
  if (msg.includes("Unauthorized") || msg.includes("Invalid or expired")) return 401;
  if (msg.includes("Forbidden") || msg.includes("denied") || msg.includes("Only")) return 403;
  if (msg.includes("already") || msg.includes("Conflict")) return 409;
  if (msg.includes("required") || msg.includes("Validation")) return 422;
  if (msg.includes("Simulated")) return 500;

  return 400;
}

export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  const status = error instanceof Error ? mapErrorToStatus(error) : 500;
  return NextResponse.json({ error: message }, { status });
}
