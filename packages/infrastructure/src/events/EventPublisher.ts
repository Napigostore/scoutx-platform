export interface EventPublisher {
  publish(topic: string, event: unknown): Promise<void>;
}

export class InMemoryEventPublisher implements EventPublisher {
  private handlers = new Map<string, Array<(event: unknown) => void>>();

  subscribe(topic: string, handler: (event: unknown) => void): void {
    const list = this.handlers.get(topic) || [];
    list.push(handler);
    this.handlers.set(topic, list);
  }

  async publish(topic: string, event: unknown): Promise<void> {
    const list = this.handlers.get(topic) || [];
    for (const handler of list) {
      handler(event);
    }
  }
}

export class EventBus implements EventPublisher {
  private publisher = new InMemoryEventPublisher();

  async publish(topic: string, event: unknown): Promise<void> {
    await this.publisher.publish(topic, event);
  }
}
