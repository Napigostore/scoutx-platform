export interface CachePolicy {
  ttlSeconds: number;
  namespace: string;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, policy: CachePolicy): Promise<void>;
  delete(key: string): Promise<void>;
}

export class InMemoryCacheProvider implements CacheProvider {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, policy: CachePolicy): Promise<void> {
    const expiresAt = Date.now() + policy.ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export interface SingleFlight {
  execute<T>(key: string, operation: () => Promise<T>): Promise<T>;
}

export class CacheStampedeGuard implements SingleFlight {
  private promises = new Map<string, Promise<unknown>>();

  async execute<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const existing = this.promises.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = operation()
      .then((res) => {
        this.promises.delete(key);
        return res;
      })
      .catch((err) => {
        this.promises.delete(key);
        throw err;
      });

    this.promises.set(key, promise);
    return promise;
  }
}
