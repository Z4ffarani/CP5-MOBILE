import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from '../components/ConversationItem';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { PushRegistrationStatus } from '../types/notification';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

const PUSH_NOTICES: Partial<Record<PushRegistrationStatus, { icon: IconName; text: string }>> = {
  denied: {
    icon: 'notifications-off-outline',
    text: 'Notificações desativadas. Permita as notificações do WhatChat nas configurações do aparelho para ser avisado de novas mensagens.',
  },
  unavailable: {
    icon: 'notifications-off-outline',
    text: 'Notificações push indisponíveis neste dispositivo.',
  },
  error: {
    icon: 'warning-outline',
    text: 'Não foi possível registrar este dispositivo para notificações.',
  },
};

export function ConversationsScreen({ navigation }: Props) {
  const { profile, logout, pushStatus } = useAuth();
  const { conversations, loading, error, reload } = useConversations(profile?.uid);
  const insets = useSafeAreaInsets();
  const pushNotice = PUSH_NOTICES[pushStatus];

  if (loading) return <Loading />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Icon name="chatbubbles" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>WhatChat</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={logout}
          accessibilityLabel="Sair da conta"
        >
          <Icon name="log-out-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {pushNotice ? (
        <View style={styles.notice}>
          <Icon name={pushNotice.icon} size={16} color={colors.primarySoftText} />
          <Text style={styles.noticeText}>{pushNotice.text}</Text>
        </View>
      ) : null}

      <ErrorMessage message={error} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        onRefresh={reload}
        refreshing={loading}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => navigation.navigate('Chat', { conversationId: item.id, conversationType: item.type })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Você ainda não tem conversas"
            description="Inicie uma conversa individual ou crie um grupo usando os botões abaixo."
          />
        }
      />

      <View style={[styles.actions, { paddingBottom: 12 + insets.bottom }]}>
        <Button
          label="Nova conversa"
          icon="chatbubble-ellipses-outline"
          onPress={() => navigation.navigate('Users', undefined)}
          style={styles.actionButton}
        />
        <Button
          label="Novo grupo"
          icon="people-outline"
          variant="outline"
          onPress={() => navigation.navigate('GroupForm', undefined)}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceElevated,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noticeText: {
    flex: 1,
    color: colors.primarySoftText,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
});
