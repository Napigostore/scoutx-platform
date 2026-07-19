import type { Role, Permission } from "../contracts/index.js";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  REQUESTER: ["profile:read", "profile:update:self", "mission:create", "mission:update:self"],
  SCOUT: ["profile:read", "profile:update:self", "discovery:read", "recommendation:read"],
  ADMIN: [
    "profile:read",
    "profile:update:self",
    "discovery:read",
    "recommendation:read",
    "mission:create",
    "mission:update:self",
    "moderation:review",
    "administration:manage",
  ],
};

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
