import React from 'react';
import { Pressable, Image, View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme/colors';

type PhotoPickerProps = {
  uri: string | null;
  placeholderIcon: IconName;
  label: string;
  onPress: () => void;
};

const SIZE = 104;

export function PhotoPicker({ uri, placeholderIcon, label, onPress }: PhotoPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.picker} onPress={onPress} accessibilityLabel={label}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <Icon name={placeholderIcon} size={44} color={colors.primarySoftText} />
        )}
        <View style={styles.badge}>
          <Icon name="camera" size={16} color={colors.onPrimary} />
        </View>
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  picker: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
