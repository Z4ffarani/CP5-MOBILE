import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Icon, type IconName } from '../components/Icon';
import { getSharedProfile } from '../services/userService';
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
    // Dados cadastrais vêm da API, que só os entrega a quem tem conversa individual ou grupo em comum.
    getSharedProfile(uid)
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

  const fields: { icon: IconName; label: string; value: string }[] = [
    { icon: 'mail-outline', label: 'E-mail', value: fieldOrFallback(profile.email) },
    { icon: 'call-outline', label: 'Número de celular', value: fieldOrFallback(profile.phoneNumber) },
    { icon: 'calendar-outline', label: 'Data de nascimento', value: fieldOrFallback(profile.birthDate) },
  ];

  return (
    <View style={styles.container}>
      <Avatar uri={profile.photoUrl} name={profile.name} size={112} />
      <Text style={styles.name}>{fieldOrFallback(profile.name)}</Text>

      <View style={styles.card}>
        {fields.map((field, index) => (
          <View key={field.label} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <Icon name={field.icon} size={18} color={colors.primarySoftText} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.label}>{field.label}</Text>
              <Text style={styles.value}>{field.value}</Text>
            </View>
          </View>
        ))}
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
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
});
