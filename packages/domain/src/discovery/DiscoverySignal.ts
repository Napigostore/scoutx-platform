export interface DiscoverySignal {
  id: string;
  kind: "mission" | "scout" | "location";
  score: number;
  reason: string;
}

export function createDiscoverySignal(params: Omit<DiscoverySignal, "id">): DiscoverySignal {
  return {
    id: `${params.kind}:${params.reason.toLowerCase().replace(/\s+/g, "-")}`,
    ...params,
  };
}
