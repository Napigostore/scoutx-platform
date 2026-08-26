import type { DiscoverySignal } from "@scoutx/domain";

export interface DiscoveryRepository {
  save(signal: DiscoverySignal): Promise<void>;
  findById(id: string): Promise<DiscoverySignal | null>;
  delete(id: string): Promise<void>;
  findAll(): Promise<readonly DiscoverySignal[]>;
}
