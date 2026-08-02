const fs = require("fs");
const content = `import type { Role, Permission } from "../contracts/index.js";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  user: [
    "profile:read",
    "profile:update:self",
    "discovery:read",
    "recommendation:read",
    "mission:create",
    "mission:update:self",
  ],
  moderator: ["profile:read", "discovery:read", "recommendation:read", "moderation:review"],
  admin: [
    "profile:read",
    "profile:update:self",
    "discovery:read",
    "recommendation:read",
    "mission:create",
    "mission:update:self",
    "moderation:review",
    "administration:manage",
  ],
  service: ["discovery:read", "recommendation:read"],
};

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
`;
fs.writeFileSync("packages/auth/src/authorization/index.ts", content, "utf8");
console.log("Successfully wrote packages/auth/src/authorization/index.ts");
