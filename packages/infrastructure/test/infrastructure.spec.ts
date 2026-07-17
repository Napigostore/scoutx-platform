import { describe, expect, it } from "vitest";
import { createDiscoverySignal } from "@scoutx/domain";
import {
  PrismaDiscoveryRepository,
  DiscoveryMapper,
  ProfileMapper,
  MemoryCacheProvider,
  InMemoryEventPublisher,
} from "../src/index.js";
import type { ScoutProfile } from "@scoutx/types";

describe("Infrastructure Layer Tests", () => {
  describe("Mappers", () => {
    it("maps DiscoverySignal correctly", () => {
      const signal = createDiscoverySignal({
        kind: "location",
        score: 0.95,
        reason: "Verified Venue",
      });

      const prismaData = DiscoveryMapper.toPrisma(signal);
      expect(prismaData.id).toBe(signal.id);
      expect(prismaData.score).toBe(0.95);

      const domainData = DiscoveryMapper.toDomain(prismaData);
      expect(domainData).toEqual(signal);
    });

    it("maps ScoutProfile correctly", () => {
      const profile: ScoutProfile = {
        id: "scout-1",
        userId: "user-1",
        displayName: "Scout One",
        bio: "Bio",
        availability: "AVAILABLE",
        reliabilityScore: 85,
        completedMissions: 10,
        categories: ["VENUE_STATUS" as any],
        tags: ["tag1"],
        currentCoordinates: { latitude: 10, longitude: 20 },
        maxRadiusMeters: 3000,
        createdAt: new Date(),
        categories: ["VENUE_STATUS"],
      };

      const prismaData = ProfileMapper.toPrisma(profile, "home-1");
      expect(prismaData.id).toBe(profile.id);
      expect(prismaData.currentLatitude).toBe(10);

      const domainData = ProfileMapper.toDomain({
        ...prismaData,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
      expect(domainData.id).toBe(profile.id);
      expect(domainData.currentCoordinates?.latitude).toBe(10);
    });
  });

  describe("Repositories", () => {
    it("performs CRUD on DiscoveryRepository", async () => {
      const repo = new PrismaDiscoveryRepository();
      const signal = createDiscoverySignal({
        kind: "mission",
        score: 0.8,
        reason: "High Reward",
      });

      await repo.save(signal);
      const found = await repo.findById(signal.id);
      expect(found).toEqual(signal);

      const all = await repo.findAll();
      expect(all).toHaveLength(1);

      await repo.delete(signal.id);
      const foundAfterDelete = await repo.findById(signal.id);
      expect(foundAfterDelete).toBeNull();
    });
  });

  describe("Cache Providers", () => {
    it("caches values with MemoryCacheProvider", async () => {
      const cache = new MemoryCacheProvider();
      await cache.set("key1", "value1");
      expect(await cache.get("key1")).toBe("value1");

      await cache.delete("key1");
      expect(await cache.get("key1")).toBeNull();
    });
  });

  describe("Event Bus", () => {
    it("publishes and subscribes to events", async () => {
      const publisher = new InMemoryEventPublisher();
      let received: unknown = null;
      publisher.subscribe("test-topic", (event) => {
        received = event;
      });

      await publisher.publish("test-topic", { hello: "world" });
      expect(received).toEqual({ hello: "world" });
    });
  });
});

describe("PrismaIdentityRepository", () => {
  it("saves and retrieves user identities and sessions", async () => {
    const { PrismaIdentityRepository } = await import("../src/index.js");
    const repo = new PrismaIdentityRepository();

    const user = {
      id: "user-1",
      email: "test@scoutx.com",
      passwordHash: "hashed:password",
      role: "user" as const,
    };

    await repo.saveUser(user);
    const foundUser = await repo.findUserByEmail("test@scoutx.com");
    expect(foundUser).toEqual(user);

    const session = {
      id: "session-1",
      userId: "user-1",
      refreshToken: "refresh-token-123",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      revoked: false,
    };

    await repo.saveSession(session);
    const foundSession = await repo.findSessionByToken("refresh-token-123");
    expect(foundSession).toEqual(session);

    await repo.revokeSession("session-1");
    const revokedSession = await repo.findSessionByToken("refresh-token-123");
    expect(revokedSession?.revoked).toBe(true);
  });
});
