import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { getUserProfile } from '../services/userService';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatUser } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function fieldOrFallback(value: string | undefined | null): string {
  return value && value.length > 0 ? value : 'Não informado';
}

export function ProfileScreen({ route }: Props) {
  const { uid } = route.params;
  const [profile, setProfile] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getUserProfile(uid)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar o perfil.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <ErrorMessage message="Perfil não encontrado." />;

  return (
    <View style={styles.container}>
      <Avatar uri={profile.photoUrl} name={profile.name} size={112} />
      <Text style={styles.name}>{fieldOrFallback(profile.name)}</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{fieldOrFallback(profile.email)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Número de celular</Text>
        <Text style={styles.value}>{fieldOrFallback(profile.phoneNumber)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Data de nascimento</Text>
        <Text style={styles.value}>{fieldOrFallback(profile.birthDate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  infoBlock: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
});
