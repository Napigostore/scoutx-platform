export class InfrastructureError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "InfrastructureError";
  }
}
