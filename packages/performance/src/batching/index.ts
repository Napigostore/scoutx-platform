export interface BatchRequest<K> {
  key: K;
}

export interface BatchResult<V> {
  value: V | null;
}

export class BatchLoader<K, V> {
  private queue: { key: K; resolve: (val: V | null) => void; reject: (err: unknown) => void }[] =
    [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchFunction: (keys: K[]) => Promise<(V | null)[]>,
    private maxBatchSize = 100,
    private delayMs = 10,
  ) {}

  async load(key: K): Promise<V | null> {
    return new Promise<V | null>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      if (this.queue.length >= this.maxBatchSize) {
        this.dispatch();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.dispatch(), this.delayMs);
      }
    });
  }

  private dispatch(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const currentBatch = this.queue.splice(0, this.maxBatchSize);
    if (currentBatch.length === 0) return;

    const keys = currentBatch.map((item) => item.key);
    this.batchFunction(keys)
      .then((results) => {
        currentBatch.forEach((item, index) => {
          const result = results[index];
          item.resolve(result !== undefined ? result : null);
        });
      })
      .catch((err) => {
        currentBatch.forEach((item) => item.reject(err));
      });
  }
}
