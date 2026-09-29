import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type ErrorMessageProps = {
  message: string | null;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: colors.danger,
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
});
