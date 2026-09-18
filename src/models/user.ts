/**
 * Mirrors the backend `User` JPA entity.
 * NOTE: `password` is intentionally omitted from anything we keep in memory
 * after login/registration — we only ever send it, never store or read it back.
 */
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Shape returned by POST /users/login.
 * The backend does not yet issue JWTs — `token` is optional so this
 * contract upgrades cleanly once it does (see auth.service.ts).
 */
export interface AuthResponse {
  user: User;
  token?: string;
}
