import { doc, getDoc, setDoc, collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore';
import { ref, push, set, onValue, query as rtdbQuery, orderByChild } from 'firebase/database';
import { firestore, rtdb } from './firebase';
import { getDirectConversationId } from '../utils/conversationId';
import { notifyNewMessage } from './notificationService';
import type { DirectConversation, ChatMessage, MessageTarget, ConversationType } from '../types/chat';

const DIRECT_CONVERSATIONS_COLLECTION = 'directConversations';

export async function findOrCreateDirectConversation(uidA: string, uidB: string): Promise<DirectConversation> {
  if (uidA === uidB) throw new Error('Não é possível iniciar uma conversa consigo mesmo.');

  const conversationId = getDirectConversationId(uidA, uidB);
  const conversationRef = doc(firestore, DIRECT_CONVERSATIONS_COLLECTION, conversationId);
  const snapshot = await getDoc(conversationRef);

  if (snapshot.exists()) {
    return snapshot.data() as DirectConversation;
  }

  const conversation: DirectConversation = {
    id: conversationId,
    type: 'direct',
    participants: [uidA, uidB].sort() as [string, string],
    createdAt: Date.now(),
  };

  await setDoc(conversationRef, conversation);
  return conversation;
}

export async function listDirectConversationsForUser(uid: string): Promise<DirectConversation[]> {
  const conversationsQuery = firestoreQuery(
    collection(firestore, DIRECT_CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', uid),
  );
  const snapshot = await getDocs(conversationsQuery);
  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as DirectConversation);
}

export async function sendMessage(params: {
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  text: string;
  target?: MessageTarget;
  mentionedUserIds?: string[];
}): Promise<void> {
  const messagesRef = ref(rtdb, `messages/${params.conversationId}`);
  const newMessageRef = push(messagesRef);
  const messageId = newMessageRef.key;
  if (!messageId) throw new Error('Não foi possível gerar o identificador da mensagem.');

  const message: ChatMessage = {
    id: messageId,
    conversationId: params.conversationId,
    conversationType: params.conversationType,
    senderId: params.senderId,
    text: params.text,
    target: params.target ?? { type: 'conversation' },
    mentionedUserIds: params.mentionedUserIds ?? [],
    createdAt: Date.now(),
  };

  await set(newMessageRef, message);
  await notifyNewMessage(params.conversationId, messageId);
}

export function listenToMessages(
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onAccessError: () => void,
): () => void {
  const messagesQuery = rtdbQuery(ref(rtdb, `messages/${conversationId}`), orderByChild('createdAt'));

  return onValue(
    messagesQuery,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child) => {
        const message = child.val() as ChatMessage;
        // O Realtime Database não armazena arrays vazios, então o campo pode vir ausente.
        messages.push({ ...message, mentionedUserIds: message.mentionedUserIds ?? [] });
        return false;
      });
      onMessages(messages);
    },
    // Chamado quando as regras negam a leitura, por exemplo depois que o integrante é removido do grupo.
    onAccessError,
  );
}
