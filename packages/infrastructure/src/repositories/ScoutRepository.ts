import type { ScoutProfile } from "@scoutx/types";

export interface ScoutRepository {
  findById(id: string): Promise<ScoutProfile | null>;
  findByUserId(userId: string): Promise<ScoutProfile | null>;
  findAvailable(params: {
    categories?: string[];
    maxRadiusMeters?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<readonly ScoutProfile[]>;
  update(profile: ScoutProfile): Promise<void>;
  updateLocation(id: string, latitude: number, longitude: number): Promise<void>;
  incrementCompletedMissions(id: string): Promise<number>;
  count(): Promise<number>;
}
