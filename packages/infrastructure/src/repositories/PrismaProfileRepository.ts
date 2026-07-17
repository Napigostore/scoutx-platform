import type { ScoutProfile } from "@scoutx/types";
import type { ProfileRepository } from "./ProfileRepository";
import { ProfileMapper, type PrismaScoutProfile } from "../mappers/ProfileMapper";

export class PrismaProfileRepository implements ProfileRepository {
  private profiles = new Map<string, PrismaScoutProfile>();

  async save(profile: ScoutProfile): Promise<void> {
    const prismaData = ProfileMapper.toPrisma(profile, "mock-home-location-id");
    this.profiles.set(profile.id, {
      ...prismaData,
      createdAt: profile.createdAt || new Date(),
      updatedAt: profile.updatedAt || new Date(),
    });
  }

  async findById(id: string): Promise<ScoutProfile | null> {
    const data = this.profiles.get(id);
    if (!data) return null;
    return ProfileMapper.toDomain(data);
  }

  async findByUserId(userId: string): Promise<ScoutProfile | null> {
    const data = Array.from(this.profiles.values()).find((p) => p.userId === userId);
    if (!data) return null;
    return ProfileMapper.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.profiles.delete(id);
  }
}
