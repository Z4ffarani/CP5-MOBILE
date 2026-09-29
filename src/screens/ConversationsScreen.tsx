import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from '../components/ConversationItem';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

export function ConversationsScreen({ navigation }: Props) {
  const { profile, logout } = useAuth();
  const { conversations, loading, error, reload } = useConversations(profile?.uid);

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatChat</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Sair</Text>
        </Pressable>
      </View>

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
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Você ainda não tem conversas.</Text>
          </View>
        }
      />

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Users', undefined)}>
          <Text style={styles.actionText}>Nova conversa</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('GroupForm', undefined)}>
          <Text style={styles.actionText}>Novo grupo</Text>
        </Pressable>
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
    paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  logout: {
    color: colors.surface,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: colors.surface,
    fontWeight: '700',
  },
});
