/* ─── 1. Organization Billing ─── */

export interface UsageCounter {
  missionCreditsUsed: number;
  storageBytesUsed: number;
  apiRequestsUsed: number;
  coinsPurchased: number;
}

export interface Invoice {
  id: string;
  orgId: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  issuedAt: Date;
  dueDate: Date;
}

export interface Subscription {
  id: string;
  orgId: string;
  planTier: "starter" | "pro" | "enterprise";
  renewsAt: Date;
  active: boolean;
}

export class BillingAccount {
  constructor(
    public readonly orgId: string,
    public subscription: Subscription,
    public usage: UsageCounter = {
      missionCreditsUsed: 0,
      storageBytesUsed: 0,
      apiRequestsUsed: 0,
      coinsPurchased: 0,
    },
    public invoices: Invoice[] = [],
  ) {}

  public recordUsage(type: keyof UsageCounter, amount: number): void {
    this.usage[type] += amount;
  }
}

/* ─── 2. Enterprise RBAC ─── */

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: string[];
}

export interface CustomRole {
  id: string;
  roleName: string;
  inheritedRoleIds?: string[];
  permissionGroups: PermissionGroup[];
}

export interface TemporaryPermission {
  permission: string;
  expiresAt: Date;
}

export class RBACEvaluator {
  public static hasPermission(
    userPermissions: string[],
    tempPermissions: TemporaryPermission[],
    required: string,
  ): boolean {
    if (userPermissions.includes("*") || userPermissions.includes(required)) {
      return true;
    }
    const now = new Date();
    return tempPermissions.some((tp) => tp.permission === required && tp.expiresAt > now);
  }
}

/* ─── 3. API Key Management ─── */

export interface APIKey {
  id: string;
  keyHash: string;
  scopes: string[];
  expiresAt?: Date;
  revoked: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();

  public createKey(id: string, keyHash: string, scopes: string[], expiresAt?: Date): APIKey {
    const key: APIKey = {
      id,
      keyHash,
      scopes,
      expiresAt,
      revoked: false,
      usageCount: 0,
    };
    this.keys.set(id, key);
    return key;
  }

  public revoke(id: string): boolean {
    const key = this.keys.get(id);
    if (!key) return false;
    key.revoked = true;
    return true;
  }

  public recordKeyUsage(id: string): void {
    const key = this.keys.get(id);
    if (key && !key.revoked) {
      key.usageCount += 1;
      key.lastUsedAt = new Date();
    }
  }
}

/* ─── 4. Webhook Platform ─── */

export interface WebhookRegistration {
  id: string;
  targetUrl: string;
  secret: string;
  eventFilters: string[];
  active: boolean;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  statusCode: number;
  attempts: number;
  timestamp: Date;
}

export class WebhookPlatform {
  private webhooks: Map<string, WebhookRegistration> = new Map();
  private logs: WebhookDeliveryLog[] = [];

  public register(
    id: string,
    targetUrl: string,
    secret: string,
    eventFilters: string[],
  ): WebhookRegistration {
    const wh: WebhookRegistration = { id, targetUrl, secret, eventFilters, active: true };
    this.webhooks.set(id, wh);
    return wh;
  }

  public logDelivery(log: WebhookDeliveryLog): void {
    this.logs.push(log);
  }

  public getDeliveryLogs(webhookId: string): WebhookDeliveryLog[] {
    return this.logs.filter((l) => l.webhookId === webhookId);
  }
}

/* ─── 5. Search Query Engine ─── */

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  pinned: boolean;
  createdAt: Date;
}

export class SearchQueryEngine {
  private savedSearches: Map<string, SavedSearch> = new Map();
  private recentSearches: Map<string, string[]> = new Map();

  public saveSearch(search: SavedSearch): void {
    this.savedSearches.set(search.id, search);
  }

  public recordRecentSearch(userId: string, query: string): void {
    const history = this.recentSearches.get(userId) || [];
    this.recentSearches.set(userId, [query, ...history.filter((q) => q !== query)].slice(0, 10));
  }

  public getRecentSearches(userId: string): string[] {
    return this.recentSearches.get(userId) || [];
  }
}

/* ─── 6. Mission Templates ─── */

export interface MissionTemplate {
  id: string;
  name: string;
  category: string;
  defaultBounty: number;
  evidenceRequirements: string[];
  workflowSteps: string[];
}

export class MissionTemplateLibrary {
  private templates: Map<string, MissionTemplate> = new Map();

  public addTemplate(template: MissionTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplate(id: string): MissionTemplate | undefined {
    return this.templates.get(id);
  }
}

/* ─── 7. Automation Rules ─── */

export type AutomationTrigger =
  "on_mission_created" | "on_evidence_uploaded" | "on_verified" | "on_expired" | "on_closed";

export interface AutomationRule {
  id: string;
  trigger: AutomationTrigger;
  action: "notification" | "coin" | "trust" | "timeline" | "webhook";
  target: string;
  config: Record<string, unknown>;
}

export class AutomationRuleEngine {
  private rules: AutomationRule[] = [];

  public registerRule(rule: AutomationRule): void {
    this.rules.push(rule);
  }

  public getRulesForTrigger(trigger: AutomationTrigger): AutomationRule[] {
    return this.rules.filter((r) => r.trigger === trigger);
  }
}

/* ─── 8. Smart Assignment ─── */

export interface ScoutAssignmentCandidate {
  scoutId: string;
  distanceKm: number;
  trustScore: number;
  available: boolean;
  categoryExpertise: string[];
  currentWorkload: number;
}

export class SmartAssignmentEngine {
  public static findBestScout(
    candidates: ScoutAssignmentCandidate[],
    category: string,
  ): ScoutAssignmentCandidate | undefined {
    return candidates
      .filter((c) => c.available && c.categoryExpertise.includes(category))
      .sort((a, b) => {
        const scoreA = a.trustScore * 2 - a.distanceKm - a.currentWorkload * 5;
        const scoreB = b.trustScore * 2 - b.distanceKm - b.currentWorkload * 5;
        return scoreB - scoreA;
      })[0];
  }
}

/* ─── 9. Marketplace Insights ─── */

export interface MarketplaceInsights {
  topCategories: Array<{ category: string; count: number }>;
  averageBounty: number;
  completionRatePercent: number;
  scoutDemandIndex: number; // 0-100
  regionalStats: Array<{ region: string; activeMissions: number }>;
}

export class MarketplaceInsightsEngine {
  public static calculateInsights(
    missions: Array<{ category: string; bounty: number; status: string; region: string }>,
  ): MarketplaceInsights {
    const categoryCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    let totalBounty = 0;
    let completedCount = 0;

    for (const m of missions) {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
      regionCounts[m.region] = (regionCounts[m.region] || 0) + 1;
      totalBounty += m.bounty;
      if (m.status === "completed") completedCount += 1;
    }

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const regionalStats = Object.entries(regionCounts).map(([region, activeMissions]) => ({
      region,
      activeMissions,
    }));

    return {
      topCategories,
      averageBounty: missions.length > 0 ? Math.round(totalBounty / missions.length) : 0,
      completionRatePercent:
        missions.length > 0 ? Number(((completedCount / missions.length) * 100).toFixed(1)) : 100,
      scoutDemandIndex: Math.min(100, missions.length * 4),
      regionalStats,
    };
  }
}

/* ─── 10. Export Engine ─── */

export type ExportFormat = "csv" | "json" | "pdf";

export class ExportEngine {
  public static formatData<T extends Record<string, unknown>>(
    data: T[],
    format: ExportFormat,
  ): string {
    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }
    if (format === "csv") {
      const first = data[0];
      if (!first) return "";
      const headers = Object.keys(first);
      const rows = data.map((item) =>
        headers.map((h) => `"${String(item[h] ?? "").replace(/"/g, '""')}"`).join(","),
      );
      return [headers.join(","), ...rows].join("\n");
    }
    // PDF Abstraction text output
    return `PDF Export Document\nTotal Records: ${data.length}\nGenerated at: ${new Date().toISOString()}`;
  }
}
