import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { ChatUser } from '../types/user';

const USERS_COLLECTION = 'users';

export async function createUserProfile(user: ChatUser): Promise<void> {
  await setDoc(doc(firestore, USERS_COLLECTION, user.uid), user);
}

export async function getUserProfile(uid: string): Promise<ChatUser | null> {
  const snapshot = await getDoc(doc(firestore, USERS_COLLECTION, uid));
  return snapshot.exists() ? (snapshot.data() as ChatUser) : null;
}

export async function listUsers(): Promise<ChatUser[]> {
  const snapshot = await getDocs(query(collection(firestore, USERS_COLLECTION), orderBy('name')));
  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as ChatUser);
}
