import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './userService';
import { uploadUserPhoto } from './storageService';
import type { ChatUser, LoginInput, RegisterInput } from '../types/user';

export async function register(input: RegisterInput): Promise<ChatUser> {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const uid = credential.user.uid;

  const photoUrl = input.photoUri ? await uploadUserPhoto(uid, input.photoUri) : '';

  const profile: ChatUser = {
    uid,
    name: input.name,
    email: input.email,
    phoneNumber: input.phoneNumber,
    birthDate: input.birthDate,
    photoUrl,
    createdAt: Date.now(),
  };

  await createUserProfile(profile);
  return profile;
}

export async function login(input: LoginInput): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
