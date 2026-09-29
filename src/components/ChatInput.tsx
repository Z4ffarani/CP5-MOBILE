import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatUser } from '../types/user';

type ChatInputProps = {
  onSend: (text: string, mentionedUserIds: string[]) => void;
  disabled?: boolean;
  mentionableMembers?: ChatUser[];
};

export function ChatInput({ onSend, disabled, mentionableMembers }: ChatInputProps) {
  const [text, setText] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  function toggleMention(user: ChatUser) {
    setMentionedUserIds((current) =>
      current.includes(user.uid) ? current.filter((id) => id !== user.uid) : [...current, user.uid],
    );
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, mentionedUserIds);
    setText('');
    setMentionedUserIds([]);
  }

  return (
    <View>
      {mentionableMembers && mentionableMembers.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mentionsBar}>
          {mentionableMembers.map((member) => {
            const selected = mentionedUserIds.includes(member.uid);
            return (
              <Pressable
                key={member.uid}
                style={[styles.mentionChip, selected && styles.mentionChipSelected]}
                onPress={() => toggleMention(member)}
              >
                <Text style={[styles.mentionChipText, selected && styles.mentionChipTextSelected]}>
                  @{member.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Digite uma mensagem"
          placeholderTextColor={colors.placeholder}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (disabled || !text.trim()) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={disabled || !text.trim()}
        >
          <Text style={styles.sendLabel}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mentionsBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: colors.surface,
  },
  mentionChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  mentionChipSelected: {
    backgroundColor: colors.primary,
  },
  mentionChipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  mentionChipTextSelected: {
    color: colors.surface,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.placeholder,
  },
  sendLabel: {
    color: colors.surface,
    fontWeight: '600',
  },
});
