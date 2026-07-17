export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export class RedisProvider implements CacheProvider {
  private memory = new MemoryCacheProvider();

  async get<T>(key: string): Promise<T | null> {
    return this.memory.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.memory.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.memory.delete(key);
  }
}
