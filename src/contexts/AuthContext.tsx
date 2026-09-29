import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { observeAuthState, login as loginService, logout as logoutService, register as registerService } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { registerDeviceForPush } from '../services/notificationService';
import type { ChatUser, LoginInput, RegisterInput } from '../types/user';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: ChatUser | null;
  loading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        await registerDeviceForPush(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    try {
      await loginService(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      throw err;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setError(null);
    try {
      const createdProfile = await registerService(input);
      setProfile(createdProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, error, login, register, logout }),
    [firebaseUser, profile, loading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext deve ser usado dentro de um AuthProvider.');
  return context;
}
