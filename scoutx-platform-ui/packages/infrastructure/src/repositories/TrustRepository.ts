/**
 * Trust domain types for the repository layer.
 */

export interface TrustScoreRecord {
  userId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustActionRecord {
  id: string;
  actorId: string;
  targetId: string;
  action: "VERIFIED" | "DISPUTED" | "ENDORSED" | "BADGE_EARNED";
  missionId: string | null;
  createdAt: Date;
}

export interface CreateTrustActionInput {
  id: string;
  actorId: string;
  targetId: string;
  action: "VERIFIED" | "DISPUTED" | "ENDORSED" | "BADGE_EARNED";
  missionId?: string | null;
}

export interface TrustRepository {
  findScoreByUserId(userId: string): Promise<TrustScoreRecord | null>;
  upsertScore(userId: string, score: number): Promise<TrustScoreRecord>;
  createAction(input: CreateTrustActionInput): Promise<TrustActionRecord>;
  findActionsByTargetId(targetId: string): Promise<readonly TrustActionRecord[]>;
  findActionsByActorId(actorId: string): Promise<readonly TrustActionRecord[]>;
  countActionsByTargetId(targetId: string): Promise<number>;
}
