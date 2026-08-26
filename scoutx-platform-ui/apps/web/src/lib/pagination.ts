import type { NextRequest } from "next/server";

/**
 * Pagination options for list endpoints.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Standard paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

/**
 * Parse pagination query parameters from a request URL.
 */
export function parsePaginationParams(request: NextRequest | Request): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const cursor = searchParams.get("cursor") || undefined;
  return { page, limit, cursor };
}

/**
 * Build a paginated response with metadata.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: Required<Pick<PaginationParams, "page" | "limit">> & { cursor?: string },
): PaginatedResponse<T> {
  const { page, limit, cursor } = params;
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextCursor: cursor,
    },
  };
}
