import { useCallback, useEffect, useMemo, useState } from 'react';
import { listenToMessages, sendMessage } from '../services/chatService';
import { syncGroupAccess } from '../services/groupService';
import type { ChatMessage, ConversationType, MessageTarget } from '../types/chat';

export function useChat(conversationId: string, conversationType: ConversationType, senderId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    setMessages([]);
    setError(null);

    // Em grupos, garante que o espelho de integrantes no Realtime Database esteja atualizado antes de escutar.
    const prepareAccess = conversationType === 'group' ? syncGroupAccess(conversationId).catch(() => undefined) : Promise.resolve();

    prepareAccess.then(() => {
      if (cancelled) return;
      unsubscribe = listenToMessages(conversationId, setMessages, () => {
        setError('Você não tem acesso às mensagens desta conversa.');
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [conversationId, conversationType]);

  const send = useCallback(
    async (text: string, target?: MessageTarget, mentionedUserIds?: string[]) => {
      setSending(true);
      setError(null);
      try {
        await sendMessage({ conversationId, conversationType, senderId, text, target, mentionedUserIds });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, conversationType, senderId],
  );

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages]);

  return { messages: orderedMessages, sending, error, send };
}
