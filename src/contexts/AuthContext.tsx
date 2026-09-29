import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  observeAuthState,
  login as loginService,
  logout as logoutService,
  register as registerService,
  getCurrentUser,
} from '../services/authService';
import { getUserProfile } from '../services/userService';
import { registerDeviceForPush, unregisterDeviceForPush } from '../services/notificationService';
import type { ChatUser, LoginInput, RegisterInput } from '../types/user';
import type { PushRegistrationStatus } from '../types/notification';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: ChatUser | null;
  loading: boolean;
  error: string | null;
  pushStatus: PushRegistrationStatus;
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
  const [pushStatus, setPushStatus] = useState<PushRegistrationStatus>('pending');
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setPushStatus('pending');
        setLoading(false);
        return;
      }

      try {
        setProfile(await getUserProfile(user.uid));
      } catch {
        setError('Não foi possível carregar seu perfil. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }

      // Fora do caminho crítico: o app não fica preso no loading se o registro de push falhar.
      const registration = await registerDeviceForPush(user.uid);
      pushTokenRef.current = registration.token;
      setPushStatus(registration.status);
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
    const uid = getCurrentUser()?.uid;
    const token = pushTokenRef.current;
    if (uid && token) await unregisterDeviceForPush(uid, token);
    pushTokenRef.current = null;

    await logoutService();
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, error, pushStatus, login, register, logout }),
    [firebaseUser, profile, loading, error, pushStatus, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext deve ser usado dentro de um AuthProvider.');
  return context;
}
