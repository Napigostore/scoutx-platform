import type { UserIdentity, Session } from "@scoutx/auth";

export interface IdentityRepository {
  saveUser(user: UserIdentity): Promise<void>;
  findUserByEmail(email: string): Promise<UserIdentity | null>;
  findUserById(id: string): Promise<UserIdentity | null>;
  
  saveSession(session: Session): Promise<void>;
  findSessionByToken(token: string): Promise<Session | null>;
  revokeSession(id: string): Promise<void>;
}

export class PrismaIdentityRepository implements IdentityRepository {
  private users = new Map<string, UserIdentity>();
  private sessions = new Map<string, Session>();

  async saveUser(user: UserIdentity): Promise<void> {
    this.users.set(user.id, user);
  }

  async findUserByEmail(email: string): Promise<UserIdentity | null> {
    return Array.from(this.users.values()).find((u) => u.email === email) || null;
  }

  async findUserById(id: string): Promise<UserIdentity | null> {
    return this.users.get(id) || null;
  }

  async saveSession(session: Session): Promise<void> {
    this.sessions.set(session.refreshToken, session);
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    return this.sessions.get(token) || null;
  }

  async revokeSession(id: string): Promise<void> {
    const session = Array.from(this.sessions.values()).find((s) => s.id === id);
    if (session) {
      const updated: Session = { ...session, revoked: true };
      this.sessions.set(session.refreshToken, updated);
    }
  }
}
