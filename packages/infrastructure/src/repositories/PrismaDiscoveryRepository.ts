import type { DiscoverySignal } from "@scoutx/domain";
import type { DiscoveryRepository } from "../repositories/DiscoveryRepository";
import { DiscoveryMapper, type PrismaDiscoverySignal } from "../mappers/DiscoveryMapper";

export class PrismaDiscoveryRepository implements DiscoveryRepository {
  private signals = new Map<string, PrismaDiscoverySignal>();

  async save(signal: DiscoverySignal): Promise<void> {
    const prismaData = DiscoveryMapper.toPrisma(signal);
    this.signals.set(signal.id, prismaData);
  }

  async findById(id: string): Promise<DiscoverySignal | null> {
    const data = this.signals.get(id);
    if (!data) return null;
    return DiscoveryMapper.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.signals.delete(id);
  }

  async findAll(): Promise<readonly DiscoverySignal[]> {
    return Array.from(this.signals.values()).map((data) => DiscoveryMapper.toDomain(data));
  }
}
