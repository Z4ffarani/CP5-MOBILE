import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../components/ErrorMessage';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Icon name="chatbubbles" size={36} color={colors.onPrimary} />
        </View>
        <Text style={styles.title}>WhatChat</Text>
        <Text style={styles.subtitle}>Entre com seu e-mail e senha</Text>
      </View>

      <TextField
        icon="mail-outline"
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        icon="lock-closed-outline"
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleLogin}
      />

      <ErrorMessage message={error} />

      <Button
        label={submitting ? 'Entrando...' : 'Entrar'}
        icon="log-in-outline"
        onPress={handleLogin}
        loading={submitting}
        disabled={!email || !password}
        style={styles.submit}
      />

      <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkHint}>Não tem conta?</Text>
        <Text style={styles.link}>Criar uma conta</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  submit: {
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  linkHint: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});
