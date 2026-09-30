import { adminDatabase, adminFirestore, FIREBASE_TIMEOUT_MS } from './firebaseAdmin';
import { withTimeout } from '../utils/withTimeout';
import type { ChatGroupRecord, ConversationContext } from '../types';

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
