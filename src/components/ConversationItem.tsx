import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { colors } from '../theme/colors';
import type { ConversationSummary } from '../types/chat';

type ConversationItemProps = {
  conversation: ConversationSummary;
  onPress: () => void;
};

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Avatar uri={conversation.photoUrl} name={conversation.title} size={52} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {conversation.title}
          </Text>
          <View style={[styles.badge, conversation.type === 'group' ? styles.groupBadge : styles.directBadge]}>
            <Text style={[styles.badgeText, conversation.type === 'group' ? styles.groupBadgeText : styles.directBadgeText]}>
              {conversation.type === 'group' ? 'Grupo' : 'Direto'}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {conversation.lastMessage ?? 'Nenhuma mensagem ainda'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  directBadge: {
    backgroundColor: colors.primaryLight,
  },
  groupBadge: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  directBadgeText: {
    color: colors.primaryDark,
  },
  groupBadgeText: {
    color: colors.surface,
  },
});
