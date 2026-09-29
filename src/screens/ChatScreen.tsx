import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, KeyboardAvoidingView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { Avatar } from '../components/Avatar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { getGroup } from '../services/groupService';
import { getUserProfile } from '../services/userService';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatUser } from '../types/user';
import type { ChatMessage as ChatMessageType } from '../types/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, conversationType } = route.params;
  const { profile } = useAuth();
  const { messages, error, send } = useChat(conversationId, conversationType, profile?.uid ?? '');
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [otherUid, setOtherUid] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, ChatUser>>({});
  const listRef = useRef<FlatList<ChatMessageType>>(null);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (!profile) return;

    if (conversationType === 'group') {
      getGroup(conversationId).then(async (group) => {
        if (!group) return;
        setTitle(group.name);
        setPhotoUrl(group.photoUrl);

        const profiles = await Promise.all(group.memberIds.map((uid) => getUserProfile(uid)));
        const map: Record<string, ChatUser> = {};
        profiles.forEach((memberProfile) => {
          if (memberProfile) map[memberProfile.uid] = memberProfile;
        });
        setMembers(map);
      });
      return;
    }

    const participants = conversationId.split('_');
    const otherParticipant = participants.find((uid) => uid !== profile.uid) ?? participants[0];
    setOtherUid(otherParticipant);
    getUserProfile(otherParticipant).then((otherProfile) => {
      if (otherProfile) {
        setTitle(otherProfile.name);
        setPhotoUrl(otherProfile.photoUrl);
      }
    });
  }, [conversationId, conversationType, profile]);

  function openHeaderTarget() {
    if (conversationType === 'group') {
      navigation.navigate('GroupMembers', { groupId: conversationId });
    } else if (otherUid) {
      navigation.navigate('Profile', { uid: otherUid });
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable style={styles.headerTitle} onPress={openHeaderTarget}>
          <Avatar uri={photoUrl} name={title || '?'} size={34} />
          <View>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubtitle}>
              {conversationType === 'group' ? 'Toque para ver os integrantes' : 'Toque para ver o perfil'}
            </Text>
          </View>
        </Pressable>
      ),
      headerRight:
        conversationType === 'group'
          ? () => (
              <Pressable onPress={openHeaderTarget} hitSlop={8} accessibilityLabel="Integrantes do grupo">
                <Icon name="people-outline" size={22} color={colors.text} />
              </Pressable>
            )
          : undefined,
    });
  }, [navigation, title, photoUrl, otherUid, conversationType]);

  const scrollToLatest = useCallback((animated: boolean) => {
    listRef.current?.scrollToEnd({ animated });
  }, []);

  async function handleSend(text: string, mentionedUserIds: string[]) {
    try {
      const target = mentionedUserIds.length === 1 ? { type: 'member' as const, memberId: mentionedUserIds[0] } : undefined;
      await send(text, target, mentionedUserIds);
    } catch {
      return;
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ErrorMessage message={error} />

      {/* Lista em ordem cronológica (sem `inverted`, que espelha o conteúdo e se comporta diferente entre
          versões e plataformas); ao receber mensagens ela rola até a mais recente. */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollToLatest(true)}
        onLayout={() => scrollToLatest(false)}
        renderItem={({ item }) => (
          <ChatMessage
            message={item}
            isOwn={item.senderId === profile?.uid}
            authorName={conversationType === 'group' ? members[item.senderId]?.name ?? null : null}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState icon="chatbubble-ellipses-outline" title="Nenhuma mensagem ainda" description="Envie a primeira!" />
          </View>
        }
      />

      <ChatInput
        onSend={handleSend}
        mentionableMembers={
          conversationType === 'group' ? Object.values(members).filter((member) => member.uid !== profile?.uid) : undefined
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 190,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
