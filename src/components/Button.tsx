import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme/colors';

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const contentColor = isPrimary ? colors.onPrimary : colors.primary;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        pressed && (isPrimary ? styles.primaryPressed : styles.outlinePressed),
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <Icon name={icon} size={20} color={contentColor} />
      ) : null}
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlinePressed: {
    backgroundColor: colors.primarySoft,
  },
  inactive: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
  },
});
