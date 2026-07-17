export interface CursorPayload {
  version: number;
  lastScore: number;
  lastCandidateId: string;
  filterHash: string;
}

export class CursorSerializer {
  static encode(payload: CursorPayload): string {
    const json = JSON.stringify(payload);
    if (typeof Buffer !== "undefined") {
      return Buffer.from(json).toString("base64url");
    }
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  static decode(cursor: string): CursorPayload {
    try {
      let json = "";
      if (typeof Buffer !== "undefined") {
        json = Buffer.from(cursor, "base64url").toString("utf8");
      } else {
        const base64 = cursor.replace(/-/g, "+").replace(/_/g, "/");
        json = atob(base64);
      }
      const parsed = JSON.parse(json);
      if (
        typeof parsed.version !== "number" ||
        typeof parsed.lastScore !== "number" ||
        typeof parsed.lastCandidateId !== "string" ||
        typeof parsed.filterHash !== "string"
      ) {
        throw new Error("Invalid cursor payload structure");
      }
      return parsed as CursorPayload;
    } catch (err) {
      throw new Error(`Invalid cursor format: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
