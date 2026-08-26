/**
 * FIWOKAN Free Beta Configuration Layer
 *
 * Controlled via process.env.FIWOKAN_BETA_MODE
 * - When true: Platform fee is ZERO, free beta mission publishing is enabled.
 * - When false: Standard MoMo production checkout gateway flow is required.
 */
export function isBetaModeActive(): boolean {
  return process.env.FIWOKAN_BETA_MODE === "true";
}
