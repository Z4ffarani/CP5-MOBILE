import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatMessage as ChatMessageType } from '../types/chat';

type ChatMessageProps = {
  message: ChatMessageType;
  isOwn: boolean;
  authorName: string | null;
};

export function ChatMessage({ message, isOwn, authorName }: ChatMessageProps) {
  const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && authorName ? <Text style={styles.author}>{authorName}</Text> : null}
        <Text style={styles.text}>{message.text}</Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleOutgoing,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleIncoming,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  author: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primarySoftText,
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  time: {
    fontSize: 10,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeOwn: {
    color: colors.bubbleOutgoingMeta,
  },
});
