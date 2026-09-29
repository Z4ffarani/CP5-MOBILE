import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { getGroup } from '../services/groupService';
import { getUserProfile } from '../services/userService';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const loadedGroup = await getGroup(groupId);
      setGroup(loadedGroup);
      if (loadedGroup) {
        const profiles = await Promise.all(loadedGroup.memberIds.map((uid) => getUserProfile(uid)));
        setMembers(profiles.filter((item): item is ChatUser => item !== null));
      }
    } catch {
      setLoadError('Não foi possível carregar os integrantes do grupo.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Carrega ao abrir e recarrega ao voltar da seleção de usuários ou da edição do grupo.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isOwner = group !== null && profile?.uid === group.ownerId;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isOwner
        ? () => (
            <Pressable
              onPress={() => navigation.navigate('GroupForm', { groupId })}
              hitSlop={8}
              accessibilityLabel="Editar grupo"
            >
              <Icon name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isOwner, groupId]);

  async function handleRemove(memberId: string) {
    if (!profile || !group) return;
    const ok = await removeGroupMember(group.id, profile.uid, memberId);
    if (ok) load();
  }

  if (loading) return <Loading />;
  if (loadError) return <ErrorMessage message={loadError} />;
  if (!group) return <ErrorMessage message="Grupo não encontrado." />;

  const slots = availableSlots(group.memberLimit, group.memberIds);
  const occupancy = Math.min(1, group.memberIds.length / group.memberLimit);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Icon name="people" size={18} color={colors.primarySoftText} />
          <Text style={styles.summaryTitle}>
            {group.memberIds.length} de {group.memberLimit} integrantes
          </Text>
          <Text style={[styles.summarySlots, slots === 0 && styles.summaryFull]}>
            {slots === 0 ? 'Grupo cheio' : `${slots} vaga(s) disponível(is)`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${occupancy * 100}%` }, slots === 0 && styles.progressFull]} />
        </View>
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
        <Button
          label="Adicionar integrantes"
          icon="person-add-outline"
          onPress={() =>
            navigation.navigate('Users', { selectForGroup: true, initialSelectedIds: group.memberIds, groupId: group.id })
          }
          style={styles.addButton}
        />
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
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summarySlots: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryFull: {
    color: colors.danger,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressFull: {
    backgroundColor: colors.danger,
  },
  addButton: {
    margin: 12,
  },
});
