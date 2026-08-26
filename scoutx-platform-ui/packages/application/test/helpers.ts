import type { EventBus, DomainEvent } from "@scoutx/events";

export class NoopEventBus implements EventBus {
  async publish(_event: DomainEvent): Promise<void> {}
}
