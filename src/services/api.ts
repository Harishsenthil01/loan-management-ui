import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/models/api';
import { getToken, clearSession } from '@/utils/session';

// No hard-coded API URLs — configured per environment via Vite env vars.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: attach auth token when present ---------------
// The current backend does not issue a JWT yet. Once it does, `getToken()`
// will return it and this header starts working with no other changes
// needed anywhere else in the app.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return config;
});

/**
 * Maps raw backend/network errors to a single, user-friendly message.
 * UI components should catch and display `error.message` from here rather
 * than surfacing raw Axios/backend errors.
 */
export class AppError extends Error {
  status?: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status?: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function friendlyMessageFor(status: number | undefined, data: ApiErrorResponse | undefined): string {
  if (data?.message) return data.message;

  switch (status) {
    case 400:
      return 'Some information you entered is invalid. Please review the form and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested information could not be found.';
    case 409:
      return 'This record already exists or conflicts with existing data.';
    case 500:
      return 'Something went wrong on our end. Please try again shortly.';
    default:
      return 'Unable to connect. Please check your network connection and try again.';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      clearSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const message = friendlyMessageFor(status, data);
    return Promise.reject(new AppError(message, status, data?.errors));
  },
);
