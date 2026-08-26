import { describe, it } from "vitest";
import {
  InMemoryCacheProvider,
  CacheStampedeGuard,
  BatchLoader,
  ConcurrencyLimiter,
} from "../src/index.js";

describe("Performance Benchmarks", () => {
  it("benchmarks cache hit vs miss", async () => {
    const cache = new InMemoryCacheProvider();
    await cache.set("bench-key", "bench-val", { ttlSeconds: 60, namespace: "bench" });

    const startHit = performance.now();
    for (let i = 0; i < 10000; i++) {
      await cache.get("bench-key");
    }
    const endHit = performance.now();

    const startMiss = performance.now();
    for (let i = 0; i < 10000; i++) {
      await cache.get("non-existent");
    }
    const endMiss = performance.now();

    console.log(`[Benchmark] Cache Hit 10k ops: ${(endHit - startHit).toFixed(2)}ms`);
    console.log(`[Benchmark] Cache Miss 10k ops: ${(endMiss - startMiss).toFixed(2)}ms`);
  });

  it("benchmarks batch loader vs individual calls", async () => {
    const individualFn = async (key: string) => `val:${key}`;
    const batchFn = async (keys: string[]) => keys.map((k) => `val:${k}`);
    const loader = new BatchLoader(batchFn, 100, 2);

    const startInd = performance.now();
    for (let i = 0; i < 1000; i++) {
      await individualFn(`key-${i}`);
    }
    const endInd = performance.now();

    const startBatch = performance.now();
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(loader.load(`key-${i}`));
    }
    await Promise.all(promises);
    const endBatch = performance.now();

    console.log(`[Benchmark] Individual 1k ops: ${(endInd - startInd).toFixed(2)}ms`);
    console.log(`[Benchmark] Batched 1k ops: ${(endBatch - startBatch).toFixed(2)}ms`);
  });
});
