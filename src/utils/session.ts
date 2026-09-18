import type { User } from '@/models/user';

const USER_KEY = 'lms_current_user';
const TOKEN_KEY = 'lms_auth_token';
const REMEMBER_KEY = 'lms_remember_me';

/**
 * Session data is stored in sessionStorage by default so it disappears when
 * the tab closes. If the user checks "Remember me" at login we mirror it
 * into localStorage instead. In neither case do we ever persist the
 * password — only the authenticated user's public profile and (once the
 * backend supports it) a bearer token.
 */
function store(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage;
}

export function saveSession(user: User, token: string | undefined, remember: boolean): void {
  const target = store(remember);
  target.setItem(USER_KEY, JSON.stringify(user));
  if (token) target.setItem(TOKEN_KEY, token);
  target.setItem(REMEMBER_KEY, String(remember));
  // Ensure only one copy exists at a time.
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(USER_KEY);
  other.removeItem(TOKEN_KEY);
  other.removeItem(REMEMBER_KEY);
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REMEMBER_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
