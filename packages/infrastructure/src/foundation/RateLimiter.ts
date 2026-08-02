export interface RateLimitOptions {
  limit: number; // max requests
  windowMs: number; // duration window in milliseconds
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  public isAllowed(
    key: string,
    options: RateLimitOptions = { limit: 10, windowMs: 60_000 },
  ): boolean {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= options.limit) {
      this.requests.set(key, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  // Predefined protected route limiters
  public checkMissionCreation(userId: string): boolean {
    return this.isAllowed(`rate:mission_create:${userId}`, { limit: 5, windowMs: 60_000 });
  }

  public checkEvidenceUpload(userId: string): boolean {
    return this.isAllowed(`rate:evidence_upload:${userId}`, { limit: 20, windowMs: 60_000 });
  }

  public checkInviteScout(userId: string): boolean {
    return this.isAllowed(`rate:invite_scout:${userId}`, { limit: 15, windowMs: 60_000 });
  }

  public checkRealtimeConnection(ip: string): boolean {
    return this.isAllowed(`rate:ws_connect:${ip}`, { limit: 10, windowMs: 10_000 });
  }

  public checkSearchAPI(ipOrUser: string): boolean {
    return this.isAllowed(`rate:search:${ipOrUser}`, { limit: 30, windowMs: 60_000 });
  }
}
