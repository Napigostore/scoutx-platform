export interface Counter {
  inc(value?: number, labels?: Record<string, string>): void;
}

export interface Gauge {
  set(value: number, labels?: Record<string, string>): void;
  inc(value?: number, labels?: Record<string, string>): void;
  dec(value?: number, labels?: Record<string, string>): void;
}

export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
}

export class SimpleCounter implements Counter {
  private value = 0;
  inc(value = 1): void {
    this.value += value;
  }
  getValue(): number {
    return this.value;
  }
}

export class SimpleGauge implements Gauge {
  private value = 0;
  set(value: number): void {
    this.value = value;
  }
  inc(value = 1): void {
    this.value += value;
  }
  dec(value = 1): void {
    this.value -= value;
  }
  getValue(): number {
    return this.value;
  }
}

export class SimpleHistogram implements Histogram {
  private values: number[] = [];
  observe(value: number): void {
    this.values.push(value);
  }
  getValues(): number[] {
    return this.values;
  }
}

export class MetricsRegistry {
  private counters = new Map<string, SimpleCounter>();
  private gauges = new Map<string, SimpleGauge>();
  private histograms = new Map<string, SimpleHistogram>();

  counter(name: string): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new SimpleCounter());
    }
    return this.counters.get(name)!;
  }

  gauge(name: string): Gauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new SimpleGauge());
    }
    return this.gauges.get(name)!;
  }

  histogram(name: string): Histogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new SimpleHistogram());
    }
    return this.histograms.get(name)!;
  }

  getMetricsSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.counters.forEach((c, k) => { snapshot[k] = c.getValue(); });
    this.gauges.forEach((g, k) => { snapshot[k] = g.getValue(); });
    this.histograms.forEach((h, k) => { snapshot[k] = h.getValues(); });
    return snapshot;
  }
}

export const globalMetrics = new MetricsRegistry();
