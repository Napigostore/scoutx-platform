declare module "@scoutx/discovery-feed" {
  export interface FeedItem {
    readonly id: string;
    readonly score: number;
    readonly payload: Record<string, unknown>;
    readonly source: unknown;
  }

  export interface FeedPage {
    readonly items: readonly FeedItem[];
    readonly nextCursor: unknown;
    readonly hasNextPage: boolean;
    readonly total: number;
  }
}
