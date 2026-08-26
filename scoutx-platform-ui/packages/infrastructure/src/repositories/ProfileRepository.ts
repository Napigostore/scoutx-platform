import type { ScoutProfile } from "@scoutx/types";

export interface ProfileRepository {
  save(profile: ScoutProfile): Promise<void>;
  findById(id: string): Promise<ScoutProfile | null>;
  findByUserId(userId: string): Promise<ScoutProfile | null>;
  delete(id: string): Promise<void>;
}
