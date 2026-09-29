import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useGroups } from '../hooks/useGroups';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { findOrCreateDirectConversation } from '../services/chatService';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Users'>;

export function UsersScreen({ navigation, route }: Props) {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const { users, loading } = useUsers(profile?.uid, search);
  const { addGroupMember, saving, error } = useGroups();
  const selectForGroup = route.params?.selectForGroup ?? false;
  const targetGroupId = route.params?.groupId;
  const initialSelectedIds = route.params?.initialSelectedIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);

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
    setStartingChatWith(uid);
    try {
      const conversation = await findOrCreateDirectConversation(profile.uid, uid);
      navigation.navigate('Chat', { conversationId: conversation.id, conversationType: 'direct' });
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

    navigation.navigate('GroupForm', { selectedMemberIds: selectedIds });
  }

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar usuário"
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.uid);
          return (
            <Pressable
              style={[styles.userRow, selected && styles.userRowSelected]}
              onPress={() => handleSelectUser(item.uid)}
              disabled={startingChatWith === item.uid}
            >
              <Avatar uri={item.photoUrl} name={item.name} size={44} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              {selectForGroup ? (
                <View style={[styles.checkbox, selected && styles.checkboxChecked]} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          </View>
        }
      />

      {selectForGroup ? (
        <>
          <ErrorMessage message={error} />
          <Pressable style={styles.confirmButton} onPress={confirmSelection} disabled={saving}>
            <Text style={styles.confirmText}>
              {saving ? 'Salvando...' : `Confirmar seleção (${selectedIds.length})`}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  search: {
    margin: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userRowSelected: {
    backgroundColor: colors.primaryLight,
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  empty: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 12,
  },
  confirmText: {
    color: colors.surface,
    fontWeight: '700',
  },
});
