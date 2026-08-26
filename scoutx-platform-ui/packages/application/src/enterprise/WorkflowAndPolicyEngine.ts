/* ─── Workflow Engine ─── */

export type MissionState =
  "draft" | "active" | "submitted" | "verified" | "completed" | "cancelled";
export type EvidenceState = "pending" | "scanning" | "reviewed" | "approved" | "rejected";
export type EscrowState = "unlocked" | "locked" | "releasing" | "released" | "refunded";

export interface WorkflowTransition<T extends string> {
  from: T;
  to: T;
  onBeforeTransition?: () => boolean;
  onAfterTransition?: () => void;
}

export class WorkflowEngine<T extends string> {
  private currentState: T;
  private allowedTransitions: Map<T, Set<T>> = new Map();

  constructor(initialState: T) {
    this.currentState = initialState;
  }

  public registerTransition(from: T, to: T): void {
    const existing = this.allowedTransitions.get(from) || new Set();
    existing.add(to);
    this.allowedTransitions.set(from, existing);
  }

  public canTransition(to: T): boolean {
    const allowed = this.allowedTransitions.get(this.currentState);
    return allowed ? allowed.has(to) : false;
  }

  public transition(to: T, onAudit?: (from: T, to: T) => void): boolean {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid workflow transition from ${this.currentState} to ${to}`);
    }
    const oldState = this.currentState;
    this.currentState = to;
    onAudit?.(oldState, to);
    return true;
  }

  public getState(): T {
    return this.currentState;
  }
}

/* ─── Policy Engine ─── */

export type PolicyDomain = "mission" | "evidence" | "coin" | "trust" | "moderation";

export interface PolicyRule<T> {
  id: string;
  domain: PolicyDomain;
  description: string;
  evaluate: (context: T) => boolean;
}

export class PolicyEngine<T> {
  private rules: PolicyRule<T>[] = [];

  public addRule(rule: PolicyRule<T>): void {
    this.rules.push(rule);
  }

  public evaluateAll(context: T): { passed: boolean; failedRules: PolicyRule<T>[] } {
    const failedRules = this.rules.filter((rule) => !rule.evaluate(context));
    return {
      passed: failedRules.length === 0,
      failedRules,
    };
  }
}

/* ─── Feature Flag System ─── */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 - 100
  targetUsers?: string[];
  targetEnvironments?: string[];
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  public setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  public isEnabled(key: string, userId?: string, environment = "production"): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) return false;

    if (flag.targetEnvironments && !flag.targetEnvironments.includes(environment)) {
      return false;
    }

    if (userId && flag.targetUsers && flag.targetUsers.includes(userId)) {
      return true;
    }

    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    // Deterministic hash-based percentage evaluation
    if (userId) {
      const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return hash % 100 < flag.rolloutPercentage;
    }

    return Math.random() * 100 < flag.rolloutPercentage;
  }
}

/* ─── Notification Pipeline ─── */

export type Channel = "email" | "push" | "sms" | "webhook";

export interface NotificationJob {
  id: string;
  recipientId: string;
  channel: Channel;
  priority: "high" | "normal" | "low";
  payload: Record<string, unknown>;
  createdAt: Date;
}

export class NotificationPipeline {
  private queue: NotificationJob[] = [];

  public enqueueJob(job: NotificationJob): void {
    this.queue.push(job);
    this.queue.sort((a, _b) => (a.priority === "high" ? -1 : 1));
  }

  public processBatch(channel: Channel): NotificationJob[] {
    const batch = this.queue.filter((j) => j.channel === channel);
    this.queue = this.queue.filter((j) => j.channel !== channel);
    return batch;
  }
}

/* ─── Organization Layer ─── */

export interface Organization {
  id: string;
  name: string;
  teams: Team[];
  stats: { totalMissions: number; reputationScore: number };
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  assignedMissions: string[];
}

export interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "scout" | "viewer";
  permissions: string[];
}

export class OrganizationService {
  private orgs: Map<string, Organization> = new Map();

  public createOrg(id: string, name: string): Organization {
    const org: Organization = {
      id,
      name,
      teams: [],
      stats: { totalMissions: 0, reputationScore: 100 },
    };
    this.orgs.set(id, org);
    return org;
  }

  public getOrg(id: string): Organization | undefined {
    return this.orgs.get(id);
  }
}

/* ─── Data Lifecycle ─── */

export class DataLifecycleService {
  private archivedRecords: Map<string, { data: unknown; archivedAt: Date }> = new Map();
  private softDeletedIds: Set<string> = new Set();

  public softDelete(id: string): void {
    this.softDeletedIds.add(id);
  }

  public restore(id: string): boolean {
    return this.softDeletedIds.delete(id);
  }

  public archive(id: string, data: unknown): void {
    this.archivedRecords.set(id, { data, archivedAt: new Date() });
  }

  public isSoftDeleted(id: string): boolean {
    return this.softDeletedIds.has(id);
  }
}
