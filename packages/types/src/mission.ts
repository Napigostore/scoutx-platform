import { z } from "zod";

import { CoordinatesSchema } from "./location.js";

export const MissionCategorySchema = z.enum([
  "STREET_CONDITIONS",
  "VENUE_STATUS",
  "LOCAL_EVENT",
  "PRODUCT_AVAILABILITY",
  "CROWD_DENSITY",
  "WEATHER_ON_SITE",
  "PHOTO_VERIFICATION",
  "GENERAL_OBSERVATION",
  "SURVEY",
]);
export type MissionCategory = z.infer<typeof MissionCategorySchema>;

export const MissionStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "MATCHED",
  "IN_PROGRESS",
  "SUBMITTED",
  "VERIFIED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED_PENDING_SETTLEMENT",
  "DISPUTED",
  "REWARDED",
  "REFUNDED",
]);
export type MissionStatus = z.infer<typeof MissionStatusSchema>;

export const MissionUrgencySchema = z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]);
export type MissionUrgency = z.infer<typeof MissionUrgencySchema>;

export const MissionBudgetSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
});
export type MissionBudget = z.infer<typeof MissionBudgetSchema>;

export const MissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  category: MissionCategorySchema,
  status: MissionStatusSchema,
  urgency: MissionUrgencySchema,
  budget: MissionBudgetSchema,
  locationId: z.string().uuid(),
  coordinates: CoordinatesSchema,
  radiusMeters: z.number().positive().max(50_000),
  requesterId: z.string().uuid(),
  assignedScoutId: z.string().uuid().nullable(),
  requiredTags: z.array(z.string().min(1).max(40)).max(12),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  rewardPerValidSubmissionCents: z.number().int().positive().optional().nullable(),
  rewardBudgetCents: z.number().int().positive().optional().nullable(),
  remainingBudgetCents: z.number().int().positive().optional().nullable(),
  logVisibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE"),
  selectionMode: z.enum(["AUTO", "REQUESTER_SELECT"]).default("AUTO"),
  disputeMode: z.enum(["ENABLED", "DISABLED"]).default("DISABLED"),
  maxParticipants: z.number().int().positive().optional().nullable(),
  screeningEnabled: z.boolean().default(false),
  screeningQuestions: z.any().optional().nullable(),
  quotas: z.any().optional().nullable(),
});
export type Mission = z.infer<typeof MissionSchema>;

export const CreateMissionInputSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  category: MissionCategorySchema,
  urgency: MissionUrgencySchema.default("NORMAL"),
  budget: MissionBudgetSchema,
  locationId: z.string().uuid(),
  coordinates: CoordinatesSchema,
  radiusMeters: z.number().positive().max(50_000).default(1500),
  requiredTags: z.array(z.string().min(1).max(40)).max(12).default([]),
  expiresAt: z.coerce.date(),
  rewardPerValidSubmissionCents: z.number().int().positive().optional(),
  rewardBudgetCents: z.number().int().positive().optional(),
  logVisibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE"),
  selectionMode: z.enum(["AUTO", "REQUESTER_SELECT"]).default("AUTO"),
  disputeMode: z.enum(["ENABLED", "DISABLED"]).default("DISABLED"),
  maxParticipants: z.number().int().positive().optional(),
  screeningEnabled: z.boolean().default(false),
  screeningQuestions: z.any().optional(),
  quotas: z.any().optional(),
});
export type CreateMissionInput = z.infer<typeof CreateMissionInputSchema>;
