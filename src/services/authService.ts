import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, updateUserPhoto } from './userService';
import { uploadUserPhoto } from './storageService';
import type { ChatUser, LoginInput, RegisterInput, RegisterResult } from '../types/user';

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const uid = credential.user.uid;

  const profile: ChatUser = {
    uid,
    name: input.name,
    email: input.email,
    phoneNumber: input.phoneNumber,
    birthDate: input.birthDate,
    photoUrl: '',
    createdAt: Date.now(),
  };

  try {
    await createUserProfile(profile);
  } catch (err) {
    // Sem o perfil a conta ficaria inutilizável; desfaz a criação para o cadastro poder ser refeito.
    await credential.user.delete().catch(() => undefined);
    throw err;
  }

  if (!input.photoUri) return { profile, photoFailed: false };

  // A foto é enviada depois do perfil: se falhar, a conta continua válida e usa o avatar padrão.
  try {
    const photoUrl = await uploadUserPhoto(uid, input.photoUri);
    await updateUserPhoto(uid, photoUrl);
    return { profile: { ...profile, photoUrl }, photoFailed: false };
  } catch {
    return { profile, photoFailed: true };
  }
}

export async function login(input: LoginInput): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

const INVALID_SESSION_CODES = new Set([
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/user-token-expired',
  'auth/invalid-user-token',
]);

// Confere no servidor se a sessão salva ainda vale (a conta pode ter sido excluída ou desativada).
// Falhas de rede não invalidam a sessão: o usuário continua logado e o app tenta de novo depois.
export async function isSessionValid(user: User): Promise<boolean> {
  try {
    await user.getIdToken(true);
    return true;
  } catch (err) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
    return !INVALID_SESSION_CODES.has(code);
  }
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
