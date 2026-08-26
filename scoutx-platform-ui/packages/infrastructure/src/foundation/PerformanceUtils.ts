export interface CursorPage<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export class PerformanceUtils {
  /**
   * Helper for cursor-based pagination.
   */
  public static paginate<T extends { id: string }>(
    items: T[],
    cursor?: string,
    limit: number = 20,
  ): CursorPage<T> {
    let startIndex = 0;
    if (cursor) {
      const idx = items.findIndex((i) => i.id === cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const pageData = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const lastItem = pageData[pageData.length - 1] as T | undefined;
    const nextCursor = hasMore && lastItem ? lastItem.id : undefined;

    return {
      data: pageData,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Batch loader helper for resolving items in bulk.
   */
  public static async batchLoad<K, V>(
    keys: K[],
    batchFn: (uniqueKeys: K[]) => Promise<Map<K, V>>,
  ): Promise<(V | undefined)[]> {
    const uniqueKeys = Array.from(new Set(keys));
    const map = await batchFn(uniqueKeys);
    return keys.map((k) => map.get(k));
  }
}
