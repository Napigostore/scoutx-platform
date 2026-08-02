import { handlers } from "@/lib/auth";

/**
 * NextAuth (Auth.js v5) API route handler.
 * Handles all /api/auth/* endpoints including sign-in, callback, sign-out, session.
 */
export const { GET, POST } = handlers;
