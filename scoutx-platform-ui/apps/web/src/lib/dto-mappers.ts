import type { Mission } from "@scoutx/types";
import type { EvidenceRecord } from "@scoutx/infrastructure";
import type { TimelineEntryRecord } from "@scoutx/infrastructure";
import type { CoinTransactionRecord } from "@scoutx/infrastructure";
import type { TrustScoreRecord, TrustActionRecord } from "@scoutx/infrastructure";

// ─── Mission DTOs ───

export interface MissionListDTO {
  id: string;
  title: string;
  category: string;
  status: string;
  urgency: string;
  budgetCents: number;
  currency: string;
  locationId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requesterId: string;
  assignedScoutId: string | null;
  requiredTags: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionDetailDTO extends MissionListDTO {
  description: string;
}

export function toMissionListDTO(m: Mission): MissionListDTO {
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    status: m.status,
    urgency: m.urgency,
    budgetCents: m.budget.amountCents,
    currency: m.budget.currency,
    locationId: m.locationId,
    latitude: m.coordinates.latitude,
    longitude: m.coordinates.longitude,
    radiusMeters: m.radiusMeters,
    requesterId: m.requesterId,
    assignedScoutId: m.assignedScoutId,
    requiredTags: m.requiredTags,
    expiresAt: m.expiresAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export function toMissionDetailDTO(m: Mission): MissionDetailDTO {
  return {
    ...toMissionListDTO(m),
    description: m.description,
  };
}

// ─── Evidence DTOs ───

export interface EvidenceDTO {
  id: string;
  missionId: string;
  scoutId: string;
  userId: string;
  caption: string;
  type: string;
  mediaUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  verified: boolean;
  capturedAt: string;
  createdAt: string;
}

export function toEvidenceDTO(e: EvidenceRecord): EvidenceDTO {
  return {
    ...e,
    capturedAt: e.capturedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
  };
}

// ─── Timeline DTOs ───

export interface TimelineEntryDTO {
  id: string;
  missionId: string;
  eventType: string;
  summary: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function toTimelineEntryDTO(t: TimelineEntryRecord): TimelineEntryDTO {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
  };
}

// ─── Coin DTOs ───

export interface CoinTransactionDTO {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  reason: string;
  description: string | null;
  eventType: string;
  missionId: string | null;
  createdAt: string;
}

export function toCoinTransactionDTO(c: CoinTransactionRecord): CoinTransactionDTO {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
  };
}

// ─── Trust DTOs ───

export interface TrustScoreDTO {
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrustActionDTO {
  id: string;
  actorId: string;
  targetId: string;
  action: string;
  missionId: string | null;
  createdAt: string;
}

export function toTrustScoreDTO(t: TrustScoreRecord): TrustScoreDTO {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function toTrustActionDTO(t: TrustActionRecord): TrustActionDTO {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
  };
}
