export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

/**
 * A simple password hasher intended ONLY for local development and testing environments.
 * DO NOT use this in production configurations.
 */
export class SimplePasswordHasher implements PasswordHasher {
  constructor() {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PHASE &&
      !process.env.NEXT_RUNTIME
    ) {
      throw new Error(
        "Security Error: SimplePasswordHasher cannot be used in production environments. Please configure a secure, production-ready hashing implementation (e.g., Argon2id or bcrypt)."
      );
    }
  }

  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}
