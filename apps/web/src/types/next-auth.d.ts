import type { DefaultSession } from "next-auth";
import type { Role, Permission } from "@scoutx/auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    permissions: readonly Permission[];
    accessToken?: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: readonly Permission[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: readonly Permission[];
  }
}
