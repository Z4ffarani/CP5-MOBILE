import React, { useState } from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { ErrorMessage } from '../components/ErrorMessage';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { PhotoPicker } from '../components/PhotoPicker';
import { formatPhone, phoneError, formatBirthDate, birthDateError } from '../utils/profileFields';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Permissão de acesso às fotos negada.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleRegister() {
    setFormError(null);

    const fieldError = phoneError(phoneNumber) ?? birthDateError(birthDate);
    if (fieldError) {
      setFormError(fieldError);
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        birthDate: birthDate.trim(),
        photoUri,
      });
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = name && email && password && confirmPassword && phoneNumber && birthDate;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: 48 + insets.top, paddingBottom: 24 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Preencha seus dados para começar a conversar</Text>

      <PhotoPicker
        uri={photoUri}
        placeholderIcon="person"
        label={photoUri ? 'Toque para trocar a foto' : 'Adicionar foto de perfil'}
        onPress={pickPhoto}
      />

      <TextField icon="person-outline" placeholder="Nome" value={name} onChangeText={setName} />
      <TextField
        icon="mail-outline"
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        icon="call-outline"
        placeholder="Celular com DDD: (11) 91234-5678"
        keyboardType="phone-pad"
        maxLength={15}
        value={phoneNumber}
        onChangeText={(value) => setPhoneNumber(formatPhone(value))}
      />
      <TextField
        icon="calendar-outline"
        placeholder="Data de nascimento (DD/MM/AAAA)"
        keyboardType="number-pad"
        maxLength={10}
        value={birthDate}
        onChangeText={(value) => setBirthDate(formatBirthDate(value))}
      />
      <TextField icon="lock-closed-outline" placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      <TextField
        icon="shield-checkmark-outline"
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <ErrorMessage message={formError ?? error} />

      <Button
        label={submitting ? 'Criando conta...' : 'Criar conta'}
        icon="person-add-outline"
        onPress={handleRegister}
        loading={submitting}
        disabled={!isValid}
        style={styles.submit}
      />

      <Pressable style={styles.linkRow} onPress={() => navigation.goBack()}>
        <Text style={styles.linkHint}>Já tem conta?</Text>
        <Text style={styles.link}>Entrar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  submit: {
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 20,
  },
  linkHint: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});
