export type ModerationFlagType =
  "spam" | "duplicate_evidence" | "suspicious_activity" | "rapid_coin_abuse" | "low_trust_user";

export interface ModerationFlag {
  id: string;
  entityId: string;
  entityType: "mission" | "evidence" | "scout" | "comment";
  flagType: ModerationFlagType;
  reason: string;
  confidenceScore: number; // 0-100
  createdAt: Date;
  status: "pending_review" | "approved" | "rejected";
}

export class ModerationEngine {
  private flags: Map<string, ModerationFlag> = new Map();

  public evaluateContent(
    entityId: string,
    entityType: "mission" | "evidence" | "scout" | "comment",
    textContent: string,
  ): ModerationFlag | null {
    const text = textContent.toLowerCase();
    // Rule 1: Spam keyword detection
    if (
      text.includes("free coins") ||
      text.includes("click here") ||
      text.includes("http://spam")
    ) {
      return this.raiseFlag(entityId, entityType, "spam", "Contains known spam keywords", 90);
    }
    return null;
  }

  public evaluateUserTrust(scoutId: string, trustScore: number): ModerationFlag | null {
    if (trustScore < 20) {
      return this.raiseFlag(
        scoutId,
        "scout",
        "low_trust_user",
        "Trust score fallen below safety threshold",
        95,
      );
    }
    return null;
  }

  public evaluateCoinVelocity(userId: string, txCountInMinute: number): ModerationFlag | null {
    if (txCountInMinute > 10) {
      return this.raiseFlag(
        userId,
        "scout",
        "rapid_coin_abuse",
        "Abnormally high coin transaction frequency",
        85,
      );
    }
    return null;
  }

  private raiseFlag(
    entityId: string,
    entityType: "mission" | "evidence" | "scout" | "comment",
    flagType: ModerationFlagType,
    reason: string,
    confidenceScore: number,
  ): ModerationFlag {
    const id = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const flag: ModerationFlag = {
      id,
      entityId,
      entityType,
      flagType,
      reason,
      confidenceScore,
      createdAt: new Date(),
      status: "pending_review",
    };
    this.flags.set(id, flag);
    return flag;
  }

  public getPendingFlags(): ModerationFlag[] {
    return Array.from(this.flags.values()).filter((f) => f.status === "pending_review");
  }
}
