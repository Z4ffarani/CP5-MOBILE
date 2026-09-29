import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { getGroup } from '../services/groupService';
import { getUserProfile } from '../services/userService';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { availableSlots } from '../utils/groupValidation';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatGroup } from '../types/group';
import type { ChatUser } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupMembers'>;

export function GroupMembersScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { profile } = useAuth();
  const { removeGroupMember, error } = useGroups();
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [members, setMembers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const loadedGroup = await getGroup(groupId);
    setGroup(loadedGroup);
    if (loadedGroup) {
      const profiles = await Promise.all(loadedGroup.memberIds.map((uid) => getUserProfile(uid)));
      setMembers(profiles.filter((item): item is ChatUser => item !== null));
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(memberId: string) {
    if (!profile || !group) return;
    const ok = await removeGroupMember(group.id, profile.uid, memberId);
    if (ok) load();
  }

  if (loading) return <Loading />;
  if (!group) return <ErrorMessage message="Grupo não encontrado." />;

  const isOwner = profile?.uid === group.ownerId;
  const slots = availableSlots(group.memberLimit, group.memberIds);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {group.memberIds.length} de {group.memberLimit} integrantes · {slots} vaga(s) disponível(is)
        </Text>
      </View>

      <ErrorMessage message={error} />

      <FlatList
        data={members}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <GroupMemberItem
            user={item}
            isOwner={item.uid === group.ownerId}
            onPress={() => navigation.navigate('Profile', { uid: item.uid })}
            onRemove={isOwner && item.uid !== group.ownerId ? () => handleRemove(item.uid) : undefined}
          />
        )}
      />

      {isOwner && slots > 0 ? (
        <Pressable
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('Users', { selectForGroup: true, initialSelectedIds: group.memberIds, groupId: group.id })
          }
        >
          <Text style={styles.addButtonText}>Adicionar integrantes</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 12,
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
});
