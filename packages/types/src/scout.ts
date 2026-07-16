import { z } from "zod";

import { CoordinatesSchema } from "./location.js";
import { MissionCategorySchema } from "./mission.js";

export const ScoutAvailabilitySchema = z.enum(["AVAILABLE", "BUSY", "OFFLINE"]);
export type ScoutAvailability = z.infer<typeof ScoutAvailabilitySchema>;

export const ScoutProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(120),
  bio: z.string().max(1000),
  availability: ScoutAvailabilitySchema,
  reliabilityScore: z.number().min(0).max(100),
  completedMissions: z.number().int().nonnegative(),
  categories: z.array(MissionCategorySchema).min(1),
  tags: z.array(z.string().min(1).max(40)).max(24),
  homeLocationId: z.string().uuid(),
  currentCoordinates: CoordinatesSchema.nullable(),
  maxRadiusMeters: z.number().positive().max(100_000),
  languages: z.array(z.string().min(2).max(10)).min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ScoutProfile = z.infer<typeof ScoutProfileSchema>;

export const MissionSubmissionSchema = z.object({
  id: z.string().uuid(),
  missionId: z.string().uuid(),
  scoutId: z.string().uuid(),
  summary: z.string().min(10).max(4000),
  mediaUrls: z.array(z.string().url()).max(20),
  observedAt: z.coerce.date(),
  coordinates: CoordinatesSchema,
  verified: z.boolean(),
  createdAt: z.coerce.date(),
});
export type MissionSubmission = z.infer<typeof MissionSubmissionSchema>;
