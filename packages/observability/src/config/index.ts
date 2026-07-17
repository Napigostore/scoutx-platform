import { z } from "zod";

export const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type TypedConfig = z.infer<typeof ConfigSchema>;

export class EnvironmentValidator {
  static validate(env: Record<string, any>): TypedConfig {
    const result = ConfigSchema.safeParse(env);
    if (!result.success) {
      const errors = result.error.format();
      throw new Error(`Startup Configuration Validation Failed: ${JSON.stringify(errors)}`);
    }
    // Return immutable configuration
    return Object.freeze(result.data);
  }
}
