import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { Avatar } from '../components/Avatar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { getGroup } from '../services/groupService';
import { getUserProfile } from '../services/userService';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatUser } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, conversationType } = route.params;
  const { profile } = useAuth();
  const { messages, error, send } = useChat(conversationId, conversationType, profile?.uid ?? '');
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [otherUid, setOtherUid] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, ChatUser>>({});

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
          <Avatar uri={photoUrl} name={title || '?'} size={32} />
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, title, photoUrl, otherUid]);

  const orderedForList = useMemo(() => [...messages].reverse(), [messages]);

  async function handleSend(text: string, mentionedUserIds: string[]) {
    try {
      const target = mentionedUserIds.length === 1 ? { type: 'member' as const, memberId: mentionedUserIds[0] } : undefined;
      await send(text, target, mentionedUserIds);
    } catch {
      return;
    }
  }

  return (
    <View style={styles.container}>
      <ErrorMessage message={error} />

      <FlatList
        data={orderedForList}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatMessage
            message={item}
            isOwn={item.senderId === profile?.uid}
            authorName={conversationType === 'group' ? members[item.senderId]?.name ?? null : null}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma mensagem ainda. Envie a primeira!</Text>
          </View>
        }
      />

      <ChatInput
        onSend={handleSend}
        mentionableMembers={
          conversationType === 'group' ? Object.values(members).filter((member) => member.uid !== profile?.uid) : undefined
        }
      />
    </View>
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
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 200,
  },
});
