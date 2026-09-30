import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Keyboard, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import type { PublicProfile } from '../types/user';

type ChatInputProps = {
  onSend: (text: string, mentionedUserIds: string[]) => void;
  disabled?: boolean;
  mentionableMembers?: PublicProfile[];
};

export function ChatInput({ onSend, disabled, mentionableMembers }: ChatInputProps) {
  const [text, setText] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const canSend = !disabled && text.trim().length > 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Afasta o campo da barra de navegação do sistema; com o teclado aberto ela fica coberta e o recuo sobra.
  const bottomPadding = 8 + (keyboardVisible ? 0 : insets.bottom);

  function toggleMention(user: PublicProfile) {
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mentionsBar}
          contentContainerStyle={styles.mentionsContent}
        >
          <Icon name="at" size={18} color={colors.textSecondary} />
          {mentionableMembers.map((member) => {
            const selected = mentionedUserIds.includes(member.uid);
            return (
              <Pressable
                key={member.uid}
                style={[styles.mentionChip, selected && styles.mentionChipSelected]}
                onPress={() => toggleMention(member)}
              >
                {selected ? <Icon name="checkmark" size={14} color={colors.onPrimary} /> : null}
                <Text style={[styles.mentionChipText, selected && styles.mentionChipTextSelected]}>{member.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Digite uma mensagem"
          placeholderTextColor={colors.placeholder}
          multiline
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="Enviar mensagem"
        >
          <Icon name="send" size={18} color={canSend ? colors.onPrimary : colors.placeholder} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mentionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mentionsContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mentionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mentionChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  mentionChipTextSelected: {
    color: colors.onPrimary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
});
