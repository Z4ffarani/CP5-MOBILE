import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import type { ConversationSummary } from '../types/chat';

type ConversationItemProps = {
  conversation: ConversationSummary;
  onPress: () => void;
};

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const isGroup = conversation.type === 'group';

  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <View>
        <Avatar uri={conversation.photoUrl} name={conversation.title} size={52} />
        <View style={styles.typeBadge}>
          <Icon name={isGroup ? 'people' : 'person'} size={11} color={colors.onPrimary} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {conversation.lastMessage ?? (isGroup ? 'Conversa em grupo' : 'Conversa individual')}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
