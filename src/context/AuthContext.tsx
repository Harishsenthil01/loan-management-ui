import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, User } from '@/models/user';
import { AuthService } from '@/services/auth.service';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginRequest, remember: boolean) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => AuthService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (payload: LoginRequest, remember: boolean) => {
    setLoading(true);
    try {
      const loggedInUser = await AuthService.login(payload, remember);
      setUserState(loggedInUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    try {
      await AuthService.register(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser: setUserState }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
