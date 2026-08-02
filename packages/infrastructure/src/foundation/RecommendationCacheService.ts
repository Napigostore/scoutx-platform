export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class RecommendationCacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  public set<T>(key: string, value: T, ttlMs: number = 60_000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Specialized recommendation helpers
  public cacheMatchingScore(
    scoutId: string,
    missionId: string,
    score: number,
    ttlMs?: number,
  ): void {
    this.set(`match:${scoutId}:${missionId}`, score, ttlMs);
  }

  public getMatchingScore(scoutId: string, missionId: string): number | null {
    return this.get<number>(`match:${scoutId}:${missionId}`);
  }

  public cacheLeaderboard(region: string, data: unknown, ttlMs?: number): void {
    this.set(`leaderboard:${region}`, data, ttlMs);
  }

  public getLeaderboard(region: string): unknown | null {
    return this.get(`leaderboard:${region}`);
  }
}
