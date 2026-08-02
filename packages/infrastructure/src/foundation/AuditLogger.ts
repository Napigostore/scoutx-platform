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
      details,
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
