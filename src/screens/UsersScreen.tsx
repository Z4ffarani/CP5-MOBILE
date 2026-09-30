import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useGroups } from '../hooks/useGroups';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { findOrCreateDirectConversation } from '../services/chatService';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Users'>;

export function UsersScreen({ navigation, route }: Props) {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const { users, loading, error: usersError } = useUsers(profile?.uid, search);
  const { addGroupMember, saving, error } = useGroups();
  const selectForGroup = route.params?.selectForGroup ?? false;
  const targetGroupId = route.params?.groupId;
  const initialSelectedIds = route.params?.initialSelectedIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  function toggleSelection(uid: string) {
    setSelectedIds((current) =>
      current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid],
    );
  }

  async function handleSelectUser(uid: string) {
    if (selectForGroup) {
      toggleSelection(uid);
      return;
    }

    if (!profile) return;
    setChatError(null);
    setStartingChatWith(uid);
    try {
      const conversation = await findOrCreateDirectConversation(profile.uid, uid);
      navigation.replace('Chat', { conversationId: conversation.id, conversationType: 'direct' });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Não foi possível iniciar a conversa.');
    } finally {
      setStartingChatWith(null);
    }
  }

  async function confirmSelection() {
    if (targetGroupId) {
      const newIds = selectedIds.filter((id) => !initialSelectedIds.includes(id));
      for (const id of newIds) {
        await addGroupMember(targetGroupId, id);
      }
      navigation.goBack();
      return;
    }

    // No React Navigation 7, navigate empilharia um formulário novo e vazio (perdendo nome e foto já preenchidos);
    // popTo volta ao formulário existente e só acrescenta os integrantes escolhidos.
    navigation.popTo('GroupForm', { selectedMemberIds: selectedIds }, { merge: true });
  }

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <TextField
          icon="search-outline"
          placeholder="Buscar usuário"
          autoCapitalize="none"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ErrorMessage message={usersError ?? chatError} />

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.uid);
          const starting = startingChatWith === item.uid;
          return (
            <Pressable
              style={({ pressed }) => [styles.userRow, (pressed || selected) && styles.userRowHighlighted]}
              onPress={() => handleSelectUser(item.uid)}
              disabled={starting}
            >
              <Avatar uri={item.photoUrl} name={item.name} size={44} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              {selectForGroup ? (
                <Icon
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selected ? colors.primary : colors.placeholder}
                />
              ) : starting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Icon name="chatbubble-outline" size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum usuário encontrado"
            description={search ? 'Tente buscar por outro nome ou e-mail.' : undefined}
          />
        }
      />

      {selectForGroup ? (
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <ErrorMessage message={error} />
          <Button
            label={saving ? 'Salvando...' : `Confirmar seleção (${selectedIds.length})`}
            icon="checkmark-done-outline"
            onPress={confirmSelection}
            loading={saving}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  userRowHighlighted: {
    backgroundColor: colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
