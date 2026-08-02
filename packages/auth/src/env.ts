export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Fail fast in live production runtime, but allow static route data collection during next build
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      throw new Error(`${name} environment variable is required in production runtime`);
    }
    return `build-placeholder-${name.toLowerCase()}`;
  }
  return value;
}
