import { describe, it, expect, vi } from "vitest";
import {
  InMemoryCacheProvider,
  CacheStampedeGuard,
  BatchLoader,
  ConcurrencyLimiter,
  ExecutionPolicy,
  TimeoutError,
  CursorSerializer,
} from "../src/index.js";

describe("Performance Package Tests", () => {
  describe("Cache & Stampede Guard", () => {
    it("should cache values and respect TTL", async () => {
      const cache = new InMemoryCacheProvider();
      await cache.set("key1", "value1", { ttlSeconds: 1, namespace: "test" });

      expect(await cache.get("key1")).toBe("value1");

      // Simulate expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await cache.get("key1")).toBeNull();
    });

    it("should prevent stampede using single-flight execution", async () => {
      const guard = new CacheStampedeGuard();
      let calls = 0;

      const operation = async () => {
        calls++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "result";
      };

      const [res1, res2] = await Promise.all([
        guard.execute("key", operation),
        guard.execute("key", operation),
      ]);

      expect(res1).toBe("result");
      expect(res2).toBe("result");
      expect(calls).toBe(1);
    });
  });

  describe("Batching", () => {
    it("should batch multiple individual loads into a single call", async () => {
      const batchFn = vi.fn(async (keys: string[]) => keys.map((k) => `val:${k}`));
      const loader = new BatchLoader(batchFn, 10, 5);

      const [r1, r2, r3] = await Promise.all([
        loader.load("a"),
        loader.load("b"),
        loader.load("c"),
      ]);

      expect(r1).toBe("val:a");
      expect(r2).toBe("val:b");
      expect(r3).toBe("val:c");
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(batchFn).toHaveBeenCalledWith(["a", "b", "c"]);
    });
  });

  describe("Concurrency Control", () => {
    it("should limit maximum concurrent executions", async () => {
      const limiter = new ConcurrencyLimiter(2);
      let active = 0;
      let maxActive = 0;

      const task = async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active--;
      };

      await Promise.all([
        limiter.execute(task),
        limiter.execute(task),
        limiter.execute(task),
        limiter.execute(task),
      ]);

      expect(maxActive).toBeLessThanOrEqual(2);
    });
  });

  describe("Timeout & Cancellation", () => {
    it("should timeout long-running operations", async () => {
      const operation = async (signal: AbortSignal) => {
        return new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => resolve("done"), 100);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("aborted"));
          });
        });
      };

      await expect(
        ExecutionPolicy.execute(operation, { timeoutMs: 20 }),
      ).rejects.toThrow(TimeoutError);
    });
  });

  describe("Cursor Pagination", () => {
    it("should encode and decode cursor payloads correctly", () => {
      const payload = {
        version: 1,
        lastScore: 85.5,
        lastCandidateId: "candidate-123",
        filterHash: "hash-xyz",
      };

      const cursor = CursorSerializer.encode(payload);
      expect(typeof cursor).toBe("string");

      const decoded = CursorSerializer.decode(cursor);
      expect(decoded).toEqual(payload);
    });
  });
});
