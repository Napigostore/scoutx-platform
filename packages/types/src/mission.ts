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
});
export type CreateMissionInput = z.infer<typeof CreateMissionInputSchema>;
