import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import type { PublicProfile } from '../types/user';

type GroupMemberItemProps = {
  user: PublicProfile;
  isOwner: boolean;
  onPress: () => void;
  onRemove?: () => void;
};

export function GroupMemberItem({ user, isOwner, onPress, onRemove }: GroupMemberItemProps) {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <Avatar uri={user.photoUrl} name={user.name} size={44} />
      <View style={styles.content}>
        <Text style={styles.name}>{user.name}</Text>
        {isOwner ? (
          <View style={styles.ownerRow}>
            <Icon name="shield-checkmark" size={13} color={colors.primarySoftText} />
            <Text style={styles.owner}>Proprietário</Text>
          </View>
        ) : null}
      </View>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
          accessibilityLabel={`Remover ${user.name} do grupo`}
        >
          <Icon name="person-remove-outline" size={20} color={colors.danger} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  owner: {
    fontSize: 12,
    color: colors.primarySoftText,
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
