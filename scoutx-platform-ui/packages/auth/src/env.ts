export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (name === "AUTH_SECRET" || name === "NEXTAUTH_SECRET" || name === "JWT_SECRET") {
      const fallback =
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        process.env.JWT_SECRET ||
        "fiwokan-prod-auth-secret-fallback-key-32-chars!";
      return fallback;
    }
    if (name === "DATABASE_URL") {
      return process.env.DATABASE_URL || "postgresql://localhost:5432/fiwokan_dev";
    }
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      console.warn(
        `[requireEnv] WARNING: Missing environment variable '${name}' in production runtime.`,
      );
    }
    return `placeholder-${name.toLowerCase()}`;
  }
  return value;
}
