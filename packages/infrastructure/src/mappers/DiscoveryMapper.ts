import type { DiscoverySignal } from "@scoutx/domain";

export interface PrismaDiscoverySignal {
  id: string;
  kind: string;
  score: number;
  reason: string;
}

export class DiscoveryMapper {
  static toDomain(prismaSignal: PrismaDiscoverySignal): DiscoverySignal {
    return {
      id: prismaSignal.id,
      kind: prismaSignal.kind as "mission" | "scout" | "location",
      score: prismaSignal.score,
      reason: prismaSignal.reason,
    };
  }

  static toPrisma(domainSignal: DiscoverySignal): PrismaDiscoverySignal {
    return {
      id: domainSignal.id,
      kind: domainSignal.kind,
      score: domainSignal.score,
      reason: domainSignal.reason,
    };
  }
}
