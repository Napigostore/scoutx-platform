export type SearchEntityType = "investigation" | "evidence" | "scout" | "organization" | "location";

export interface SearchDocument {
  id: string;
  type: SearchEntityType;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  updatedAt: Date;
}

export class SearchIndexService {
  private index: Map<string, SearchDocument> = new Map();

  /**
   * Incremental indexing of a document without full rebuild.
   */
  public indexDocument(doc: Omit<SearchDocument, "updatedAt">): void {
    const key = `${doc.type}:${doc.id}`;
    this.index.set(key, {
      ...doc,
      updatedAt: new Date(),
    });
  }

  /**
   * Realtime incremental update of specific fields.
   */
  public updateDocument(
    type: SearchEntityType,
    id: string,
    partial: Partial<Omit<SearchDocument, "id" | "type">>,
  ): void {
    const key = `${type}:${id}`;
    const existing = this.index.get(key);
    if (existing) {
      this.index.set(key, {
        ...existing,
        ...partial,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Removes a document from the search index.
   */
  public removeDocument(type: SearchEntityType, id: string): void {
    this.index.delete(`${type}:${id}`);
  }

  /**
   * Search across indexed documents.
   */
  public search(query: string, type?: SearchEntityType): SearchDocument[] {
    const q = query.toLowerCase().trim();
    const results: SearchDocument[] = [];

    for (const doc of this.index.values()) {
      if (type && doc.type !== type) continue;
      if (!q) {
        results.push(doc);
        continue;
      }
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchContent = doc.content.toLowerCase().includes(q);
      const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));

      if (matchTitle || matchContent || matchTags) {
        results.push(doc);
      }
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
