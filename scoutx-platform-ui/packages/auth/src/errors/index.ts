export class AuthError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthenticationError extends AuthError {
  constructor(message = "Invalid credentials or token") {
    super(message, "UNAUTHENTICATED");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AuthError {
  constructor(message = "Access denied") {
    super(message, "UNAUTHORIZED");
    this.name = "AuthorizationError";
  }
}
