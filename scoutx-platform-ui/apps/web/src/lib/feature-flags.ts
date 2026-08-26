/**
 * Feature Flags Configuration
 *
 * To re-enable Livestream in the future:
 * Set NEXT_PUBLIC_LIVESTREAM_ENABLED=true in environment variables or .env.local
 */
export const IS_LIVESTREAM_ENABLED = process.env.NEXT_PUBLIC_LIVESTREAM_ENABLED === "true";
