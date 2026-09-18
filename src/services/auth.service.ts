import { apiClient } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/models/user';
import { saveSession, clearSession, getCurrentUser, isAuthenticated } from '@/utils/session';

/**
 * Centralized authentication service.
 *
 * Endpoints assumed from the spec (`POST /users`, `POST /users/login`) since
 * no live backend was available to inspect at build time — adjust the paths
 * below if the actual controller mapping differs (e.g. `/api/auth/*`).
 *
 * The backend currently returns a plain user record with no JWT. `token`
 * is read defensively so that switching the backend to JWT-based auth
 * later requires no changes outside this file.
 */
export const AuthService = {
  async register(payload: RegisterRequest): Promise<User> {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  async login(payload: LoginRequest, remember: boolean): Promise<User> {
    const { data } = await apiClient.post<AuthResponse | User>('/users/login', payload);

    // Tolerate both `{ user, token }` and a bare `User` response shape.
    const user: User = 'user' in data ? data.user : (data as User);
    const token: string | undefined = 'token' in data ? data.token : undefined;

    saveSession(user, token, remember);
    return user;
  },

  logout(): void {
    clearSession();
  },

  isAuthenticated,
  getCurrentUser,

  async updateProfile(userId: number, payload: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const { data } = await apiClient.put<User>(`/users/${userId}`, payload);
    const remembered = localStorage.getItem('lms_current_user') !== null;
    saveSession(data, undefined, remembered);
    return data;
  },
};
