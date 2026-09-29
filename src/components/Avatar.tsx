import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type AvatarProps = {
  uri: string | null | undefined;
  name: string;
  size?: number;
};

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, dimension]}>
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={dimension} onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primarySoftText,
    fontWeight: '700',
  },
});
