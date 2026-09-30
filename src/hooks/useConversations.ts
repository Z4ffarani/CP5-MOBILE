import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listDirectConversationsForUser } from '../services/chatService';
import { listGroupsForUser } from '../services/groupService';
import { getUserProfile } from '../services/userService';
import type { ConversationSummary } from '../types/chat';

export function useConversations(uid: string | undefined) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      // Sem perfil carregado não há o que listar; não deixa a tela presa no carregamento.
      setLoading(false);
      return;
    }
    // Só o primeiro carregamento ocupa a tela; os seguintes (ao voltar para a lista) usam o indicador de atualização.
    if (loadedRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [directConversations, groups] = await Promise.all([
        listDirectConversationsForUser(uid),
        listGroupsForUser(uid),
      ]);

      const directSummaries = await Promise.all(
        directConversations.map(async (conversation) => {
          const otherUid = conversation.participants.find((participant) => participant !== uid) ?? uid;
          const otherProfile = await getUserProfile(otherUid);
          const summary: ConversationSummary = {
            id: conversation.id,
            type: 'direct',
            title: otherProfile?.name ?? 'Usuário',
            photoUrl: otherProfile?.photoUrl ?? '',
            lastMessage: null,
            lastMessageAt: null,
          };
          return summary;
        }),
      );

      const groupSummaries: ConversationSummary[] = groups.map((group) => ({
        id: group.id,
        type: 'group',
        title: group.name,
        photoUrl: group.photoUrl,
        lastMessage: null,
        lastMessageAt: null,
      }));

      setConversations([...directSummaries, ...groupSummaries]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as conversas.');
    } finally {
      loadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  // Recarrega sempre que a lista volta a ficar visível, para incluir conversas e grupos criados em outras telas.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { conversations, loading, refreshing, error, reload: load };
}
