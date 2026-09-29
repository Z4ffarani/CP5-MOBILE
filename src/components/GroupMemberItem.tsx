import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { colors } from '../theme/colors';
import type { ChatUser } from '../types/user';

type GroupMemberItemProps = {
  user: ChatUser;
  isOwner: boolean;
  onPress: () => void;
  onRemove?: () => void;
};

export function GroupMemberItem({ user, isOwner, onPress, onRemove }: GroupMemberItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Avatar uri={user.photoUrl} name={user.name} size={44} />
      <View style={styles.content}>
        <Text style={styles.name}>{user.name}</Text>
        {isOwner ? <Text style={styles.owner}>Proprietário</Text> : null}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.remove}>Remover</Text>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  owner: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  remove: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
});
