import type { AuditLogger } from "@scoutx/infrastructure";
import type { EventQueue } from "../foundation/EventQueue";

/* ─── 1 & 2. Centralized Production Config & Secrets Validation ─── */

export interface ProductionConfig {
  env: "development" | "staging" | "production";
  databaseUrl: string;
  jwtSecret: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  cloudflareR2Key?: string;
  resendApiKey?: string;
}

export class ProductionConfigValidator {
  public static validate(
    envVars: Record<string, string | undefined> = process.env,
  ): ProductionConfig {
    const env = (envVars.NODE_ENV as ProductionConfig["env"]) || "development";

    if (env === "production") {
      const requiredKeys = ["DATABASE_URL", "JWT_SECRET"];
      for (const key of requiredKeys) {
        if (!envVars[key]) {
          throw new Error(
            `CRITICAL STARTUP ERROR: Missing required environment variable '${key}' in production mode.`,
          );
        }
      }
    }

    return {
      env,
      databaseUrl: envVars.DATABASE_URL || "postgresql://localhost:5432/scoutx",
      jwtSecret: envVars.JWT_SECRET || "default-beta-jwt-secret-key-12345",
      stripeSecretKey: envVars.STRIPE_SECRET_KEY,
      stripeWebhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
      cloudflareR2Key: envVars.CLOUDFLARE_R2_ACCESS_KEY_ID,
      resendApiKey: envVars.RESEND_API_KEY,
    };
  }
}

/* ─── 5. Standardized Error Handling ─── */

export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PAYMENT_FAILED"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

export class StandardDomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StandardDomainError";
  }

  public toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      ...(this.details && process.env.NODE_ENV !== "production" ? { details: this.details } : {}),
    };
  }
}

/* ─── 7. Production Evidence File Validator ─── */

export interface FileValidationOptions {
  maxSizeBytes?: number; // Default 20MB
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export class EvidenceFileValidator {
  private static readonly DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly DEFAULT_ALLOWED_MIMES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "application/pdf",
  ];
  private static readonly DEFAULT_ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".pdf"];

  public static validate(
    fileName: string,
    mimeType: string,
    fileSizeBytes: number,
    opts?: FileValidationOptions,
  ): void {
    const maxSize = opts?.maxSizeBytes ?? this.DEFAULT_MAX_SIZE;
    const allowedMimes = opts?.allowedMimeTypes ?? this.DEFAULT_ALLOWED_MIMES;
    const allowedExts = opts?.allowedExtensions ?? this.DEFAULT_ALLOWED_EXTS;

    if (fileSizeBytes <= 0 || fileSizeBytes > maxSize) {
      throw new StandardDomainError(
        "VALIDATION_ERROR",
        `File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`,
      );
    }

    if (!allowedMimes.includes(mimeType)) {
      throw new StandardDomainError("VALIDATION_ERROR", `Unsupported MIME type: '${mimeType}'`);
    }

    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (!allowedExts.includes(ext)) {
      throw new StandardDomainError("VALIDATION_ERROR", `Unsupported file extension: '${ext}'`);
    }
  }
}

/* ─── 8. Secure Admin Operations ─── */

export class SecureAdminService {
  private frozenWallets: Set<string> = new Set();
  private suspendedUsers: Set<string> = new Set();
  private blockedPayouts: Set<string> = new Set();

  constructor(
    private readonly auditLogger: AuditLogger,
    private readonly eventQueue: EventQueue,
  ) {}

  private verifyAdminAuth(adminUserId: string): void {
    if (!adminUserId || !adminUserId.startsWith("admin_")) {
      throw new StandardDomainError("FORBIDDEN", "Admin authorization required for this operation");
    }
  }

  public freezeWallet(adminUserId: string, targetUserId: string, reason: string): void {
    this.verifyAdminAuth(adminUserId);
    this.frozenWallets.add(targetUserId);

    this.auditLogger.log("admin_action", adminUserId, {
      action: "freeze_wallet",
      targetUserId,
      reason,
    });
  }

  public suspendUser(adminUserId: string, targetUserId: string, reason: string): void {
    this.verifyAdminAuth(adminUserId);
    this.suspendedUsers.add(targetUserId);

    this.auditLogger.log("admin_action", adminUserId, {
      action: "suspend_user",
      targetUserId,
      reason,
    });
  }

  public isWalletFrozen(userId: string): boolean {
    return this.frozenWallets.has(userId);
  }

  public isUserSuspended(userId: string): boolean {
    return this.suspendedUsers.has(userId);
  }
}

/* ─── 9. Dynamic Beta Feature Flags ─── */

export class DynamicBetaFeatureFlags {
  private flags: Map<string, boolean> = new Map([
    ["vehicle_verification", true],
    ["coin_economy", true],
    ["boost_marketplace", true],
    ["expert_marketplace", true],
  ]);

  public isEnabled(flagKey: string): boolean {
    return this.flags.get(flagKey) ?? false;
  }

  public setFlag(flagKey: string, enabled: boolean): void {
    this.flags.set(flagKey, enabled);
  }
}
