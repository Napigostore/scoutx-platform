import { z } from "zod";

export const UserRoleSchema = z.enum(["REQUESTER", "SCOUT", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
  role: UserRoleSchema,
  avatarUrl: z.string().url().nullable(),
  reliabilityScore: z.number().min(0).max(100),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;
