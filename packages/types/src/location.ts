import { z } from "zod";

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const GeoPointSchema = CoordinatesSchema.extend({
  accuracyMeters: z.number().nonnegative().optional(),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(120),
  country: z.string().min(2).max(120),
  countryCode: z.string().length(2),
  coordinates: CoordinatesSchema,
  timezone: z.string().min(1),
});
export type Location = z.infer<typeof LocationSchema>;
