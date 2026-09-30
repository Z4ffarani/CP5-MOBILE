import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { authorizedFetch } from './apiClient';
import type { ChatUser, PrivateProfile, PublicProfile } from '../types/user';

const USERS_COLLECTION = 'users';

function privateProfileRef(uid: string) {
  return doc(firestore, USERS_COLLECTION, uid, 'private', 'profile');
}

function toPublicProfile(data: DocumentData): PublicProfile {
  return {
    uid: String(data.uid ?? ''),
    name: String(data.name ?? ''),
    photoUrl: String(data.photoUrl ?? ''),
    createdAt: Number(data.createdAt ?? 0),
  };
}

function toPrivateProfile(data: DocumentData): PrivateProfile {
  return {
    email: String(data.email ?? ''),
    phoneNumber: String(data.phoneNumber ?? ''),
    birthDate: String(data.birthDate ?? ''),
  };
}

// Grava o perfil público e o privado juntos (lote atômico): as regras aceitam no documento público
// somente uid, nome, foto e data de criação.
export async function createUserProfile(user: ChatUser): Promise<void> {
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, USERS_COLLECTION, user.uid), toPublicProfile(user));
  batch.set(privateProfileRef(user.uid), toPrivateProfile(user));
  await batch.commit();
}

export async function updateUserPhoto(uid: string, photoUrl: string): Promise<void> {
  await updateDoc(doc(firestore, USERS_COLLECTION, uid), { photoUrl });
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snapshot = await getDoc(doc(firestore, USERS_COLLECTION, uid));
  return snapshot.exists() ? toPublicProfile(snapshot.data()) : null;
}

// Perfil completo do usuário logado. Perfis criados antes da separação guardavam os dados cadastrais no
// documento público; nesse caso eles são movidos para o documento privado na primeira leitura.
export async function getOwnProfile(uid: string): Promise<ChatUser | null> {
  const [publicSnapshot, privateSnapshot] = await Promise.all([
    getDoc(doc(firestore, USERS_COLLECTION, uid)),
    getDoc(privateProfileRef(uid)),
  ]);
  if (!publicSnapshot.exists()) return null;

  const publicData = publicSnapshot.data();
  const publicProfile = toPublicProfile(publicData);
  const hasLegacyFields = 'email' in publicData || 'phoneNumber' in publicData || 'birthDate' in publicData;

  if (privateSnapshot.exists() && !hasLegacyFields) {
    return { ...publicProfile, ...toPrivateProfile(privateSnapshot.data()) };
  }

  const privateProfile = privateSnapshot.exists() ? toPrivateProfile(privateSnapshot.data()) : toPrivateProfile(publicData);
  const batch = writeBatch(firestore);
  batch.set(privateProfileRef(uid), privateProfile);
  batch.set(doc(firestore, USERS_COLLECTION, uid), publicProfile);
  await batch.commit();

  return { ...publicProfile, ...privateProfile };
}

export async function listUsers(): Promise<PublicProfile[]> {
  const snapshot = await getDocs(query(collection(firestore, USERS_COLLECTION), orderBy('name')));
  return snapshot.docs.map((docSnapshot) => toPublicProfile(docSnapshot.data()));
}

export class ProfileAccessError extends Error {}

// Dados cadastrais de outro usuário: a API confere se há conversa individual ou grupo em comum.
export async function getSharedProfile(uid: string): Promise<ChatUser | null> {
  const response = await authorizedFetch(`/users/${uid}/profile`);
  if (response.status === 404) return null;
  if (response.status === 403) {
    throw new ProfileAccessError('Você só pode ver o perfil de quem participa de uma conversa ou grupo com você.');
  }
  if (!response.ok) throw new Error('Não foi possível carregar o perfil.');
  return (await response.json()) as ChatUser;
}
