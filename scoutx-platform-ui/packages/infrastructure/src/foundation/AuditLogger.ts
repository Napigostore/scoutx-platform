export type AuditActionCategory =
  | "mission_change"
  | "evidence_change"
  | "trust_change"
  | "coin_change"
  | "moderator_action"
  | "admin_action";

export interface AuditLogRecord {
  id: string;
  category: AuditActionCategory;
  actorId: string;
  targetId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export class AuditLogger {
  private logs: AuditLogRecord[] = [];

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      "password",
      "secret",
      "token",
      "jwt",
      "apikey",
      "stripe",
      "key",
      "authorization",
      "signature",
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
        sanitized[key] = "[REDACTED]";
      } else if (value && typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  public log(
    category: AuditActionCategory,
    actorId: string,
    details: Record<string, unknown>,
    targetId?: string,
  ): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category,
      actorId,
      targetId,
      details: this.sanitizeDetails(details),
      timestamp: new Date(),
    };
    this.logs.push(record);
    return record;
  }

  public getLogs(category?: AuditActionCategory, limit = 50): AuditLogRecord[] {
    const filtered = category ? this.logs.filter((l) => l.category === category) : this.logs;
    return filtered.slice(-limit).reverse();
  }
}
