import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, type TextInputProps } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme/colors';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  icon: IconName;
};

export function TextField({ icon, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Icon name={icon} size={20} color={focused ? colors.primary : colors.textSecondary} />
      <TextInput
        {...inputProps}
        style={styles.input}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry && !revealed}
        onFocus={(event) => {
          setFocused(true);
          inputProps.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          inputProps.onBlur?.(event);
        }}
      />
      {secureTextEntry ? (
        <Pressable
          onPress={() => setRevealed((current) => !current)}
          hitSlop={8}
          accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
});
