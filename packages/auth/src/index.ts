export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type SessionContext = {
  user: AuthenticatedUser;
  sessionId: string;
};

export interface AuthSessionStore {
  create(userId: string): Promise<{ sessionId: string; expiresAt: Date }>;
  get(sessionId: string): Promise<SessionContext | null>;
  revoke(sessionId: string): Promise<void>;
}
