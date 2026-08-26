import type { FeedItem } from "./feed-item.js";
import type { PageToken } from "../models/page-token.js";

export interface FeedPage {
  readonly items: readonly FeedItem[];
  readonly nextCursor: PageToken | null;
  readonly hasNextPage: boolean;
  readonly total: number;
}
