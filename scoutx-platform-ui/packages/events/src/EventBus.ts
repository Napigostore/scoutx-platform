import type { StorageDomainEvent, StorageProcessingRequestedEvent } from "./StorageDomainEvents";
import type { CoinDomainEvent } from "./CoinDomainEvents";
import type { MissionDomainEvent } from "./MissionDomainEvents";

export type DomainEvent =
  StorageDomainEvent | CoinDomainEvent | MissionDomainEvent | StorageProcessingRequestedEvent;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Array<(event: DomainEvent) => void>>();

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    const list = this.handlers.get(event.type) || [];
    for (const handler of list) {
      handler(event);
    }
  }
}
