/**
 * Evidence domain types for the repository layer.
 * These types represent the data shape used by repositories,
 * decoupled from Prisma-generated types.
 */

export interface EvidenceRecord {
  id: string;
  missionId: string;
  scoutId: string;
  userId: string;
  caption: string;
  type: "PHOTO" | "VIDEO" | "NOTE";
  mediaUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  verified: boolean;
  capturedAt: Date;
  createdAt: Date;
}

export interface CreateEvidenceInput {
  id: string;
  missionId: string;
  scoutId: string;
  userId: string;
  caption: string;
  type: "PHOTO" | "VIDEO" | "NOTE";
  mediaUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  capturedAt?: Date;
}

export interface EvidenceRepository {
  create(input: CreateEvidenceInput): Promise<EvidenceRecord>;
  findById(id: string): Promise<EvidenceRecord | null>;
  findByMissionId(missionId: string): Promise<readonly EvidenceRecord[]>;
  findByScoutId(scoutId: string): Promise<readonly EvidenceRecord[]>;
  verify(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  countByMissionId(missionId: string): Promise<number>;
}
