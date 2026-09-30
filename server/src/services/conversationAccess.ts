import { adminDatabase, adminFirestore, FIREBASE_TIMEOUT_MS } from './firebaseAdmin';
import { withTimeout } from '../utils/withTimeout';
import type { ChatGroupRecord, ConversationContext, FullProfile } from '../types';

// Ids de conversa direta são os dois uid ordenados unidos por "_"; ids de grupo são ids automáticos do Firestore (sem "_").
export function conversationTypeFromId(conversationId: string): 'direct' | 'group' {
  return conversationId.includes('_') ? 'direct' : 'group';
}

export async function getGroupRecord(groupId: string): Promise<ChatGroupRecord | null> {
  const snapshot = await withTimeout(adminFirestore.collection('groups').doc(groupId).get(), FIREBASE_TIMEOUT_MS);
  return snapshot.exists ? (snapshot.data() as ChatGroupRecord) : null;
}

export async function loadConversation(conversationId: string): Promise<ConversationContext | null> {
  if (conversationTypeFromId(conversationId) === 'direct') {
    const participantIds = conversationId.split('_');
    if (participantIds.length !== 2 || participantIds[0] === participantIds[1]) return null;
    return { type: 'direct', participantIds };
  }

  const group = await getGroupRecord(conversationId);
  if (!group) return null;
  return {
    type: 'group',
    participantIds: group.memberIds,
    notificationPolicy: group.notificationPolicy,
    groupName: group.name,
  };
}

// Dois usuários compartilham uma conversa quando existe a conversa individual entre eles
// (id = uids ordenados unidos por "_") ou quando ambos integram algum grupo.
export async function sharesConversation(uidA: string, uidB: string): Promise<boolean> {
  const directId = [uidA, uidB].sort().join('_');
  const direct = await withTimeout(adminFirestore.collection('directConversations').doc(directId).get(), FIREBASE_TIMEOUT_MS);
  if (direct.exists) return true;

  const groups = await withTimeout(
    adminFirestore.collection('groups').where('memberIds', 'array-contains', uidA).get(),
    FIREBASE_TIMEOUT_MS,
  );
  return groups.docs.some((groupDoc) => (groupDoc.data() as ChatGroupRecord).memberIds.includes(uidB));
}

// Perfil completo: users/{uid} (público) + users/{uid}/private/profile (dados cadastrais). Perfis antigos,
// ainda não migrados pelo app, guardam os dados cadastrais no próprio documento público.
export async function getFullProfile(uid: string): Promise<FullProfile | null> {
  const userRef = adminFirestore.collection('users').doc(uid);
  const [publicSnapshot, privateSnapshot] = await withTimeout(
    Promise.all([userRef.get(), userRef.collection('private').doc('profile').get()]),
    FIREBASE_TIMEOUT_MS,
  );
  if (!publicSnapshot.exists) return null;

  const publicData = publicSnapshot.data() ?? {};
  const privateData = privateSnapshot.exists ? privateSnapshot.data() ?? {} : publicData;
  return {
    uid,
    name: String(publicData.name ?? ''),
    photoUrl: String(publicData.photoUrl ?? ''),
    createdAt: Number(publicData.createdAt ?? 0),
    email: String(privateData.email ?? ''),
    phoneNumber: String(privateData.phoneNumber ?? ''),
    birthDate: String(privateData.birthDate ?? ''),
  };
}

export async function getUserName(uid: string): Promise<string | null> {
  const snapshot = await withTimeout(adminFirestore.collection('users').doc(uid).get(), FIREBASE_TIMEOUT_MS);
  const name = snapshot.exists ? (snapshot.get('name') as unknown) : null;
  return typeof name === 'string' && name.trim().length > 0 ? name : null;
}

// Espelha os integrantes do grupo (fonte da verdade: Firestore) em groupMembers/{groupId} no Realtime Database,
// onde as regras do RTDB os consultam para liberar leitura e escrita das mensagens somente a integrantes ativos.
export async function syncGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
  const members = Object.fromEntries(memberIds.map((uid) => [uid, true]));
  await withTimeout(adminDatabase.ref(`groupMembers/${groupId}`).set(members), FIREBASE_TIMEOUT_MS);
}
