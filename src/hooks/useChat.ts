import { useCallback, useEffect, useMemo, useState } from 'react';
import { listenToMessages, sendMessage } from '../services/chatService';
import type { ChatMessage, ConversationType, MessageTarget } from '../types/chat';

export function useChat(conversationId: string, conversationType: ConversationType, senderId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenToMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

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
