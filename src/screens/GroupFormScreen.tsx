import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { getGroup } from '../services/groupService';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { availableSlots } from '../utils/groupValidation';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatGroup, NotificationPolicy } from '../types/group';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupForm'>;

const POLICIES: { value: NotificationPolicy; label: string }[] = [
  { value: 'all_group_messages', label: 'Todas as mensagens do grupo' },
  { value: 'mentioned_members', label: 'Somente integrantes mencionados' },
  { value: 'direct_messages_only', label: 'Somente mensagens diretas' },
  { value: 'disabled', label: 'Desativado' },
];

export function GroupFormScreen({ navigation, route }: Props) {
  const { profile } = useAuth();
  const { saving, error, create, changeLimit, changePolicy } = useGroups();
  const groupId = route.params?.groupId;
  const isEditing = Boolean(groupId);

  const [existingGroup, setExistingGroup] = useState<ChatGroup | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(isEditing);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberLimit, setMemberLimit] = useState('5');
  const [policy, setPolicy] = useState<NotificationPolicy>('all_group_messages');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.selectedMemberIds) {
      setMemberIds(route.params.selectedMemberIds);
    }
  }, [route.params?.selectedMemberIds]);

  useEffect(() => {
    if (!groupId) return;
    getGroup(groupId).then((group) => {
      setExistingGroup(group);
      if (group) {
        setName(group.name);
        setMemberLimit(String(group.memberLimit));
        setPolicy(group.notificationPolicy);
        setMemberIds(group.memberIds);
      }
      setLoadingGroup(false);
    });
  }, [groupId]);

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

  async function handleSubmit() {
    setFormError(null);
    if (!profile) return;

    const limitNumber = Number(memberLimit);
    if (!Number.isInteger(limitNumber) || limitNumber < 2) {
      setFormError('Informe um limite inteiro de pelo menos 2 integrantes.');
      return;
    }

    if (isEditing && existingGroup) {
      if (existingGroup.ownerId !== profile.uid) {
        setFormError('Somente o proprietário pode editar o grupo.');
        return;
      }
      if (limitNumber !== existingGroup.memberLimit) {
        const ok = await changeLimit(existingGroup.id, profile.uid, limitNumber);
        if (!ok) return;
      }
      if (policy !== existingGroup.notificationPolicy) {
        const ok = await changePolicy(existingGroup.id, profile.uid, policy);
        if (!ok) return;
      }
      navigation.navigate('GroupMembers', { groupId: existingGroup.id });
      return;
    }

    if (!name.trim()) {
      setFormError('Informe um nome para o grupo.');
      return;
    }
    if (memberIds.length + 1 > limitNumber) {
      setFormError('O limite informado é menor que a quantidade de integrantes selecionados.');
      return;
    }

    const group = await create(profile.uid, {
      name: name.trim(),
      photoUri,
      memberIds,
      memberLimit: limitNumber,
      notificationPolicy: policy,
    });

    if (group) {
      navigation.navigate('Chat', { conversationId: group.id, conversationType: 'group' });
    }
  }

  if (loadingGroup) return <Loading />;

  const limitNumber = Number(memberLimit) || 0;
  const slots = availableSlots(limitNumber, isEditing ? memberIds : [...memberIds, 'owner']);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Editar grupo' : 'Novo grupo'}</Text>

      {!isEditing ? (
        <>
          <Pressable style={styles.photoPicker} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Text style={styles.photoPlaceholder}>Foto do grupo</Text>
            )}
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Nome do grupo"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
          />

          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Users', { selectForGroup: true, initialSelectedIds: memberIds })}
          >
            <Text style={styles.secondaryButtonText}>Selecionar integrantes ({memberIds.length})</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => existingGroup && navigation.navigate('GroupMembers', { groupId: existingGroup.id })}
        >
          <Text style={styles.secondaryButtonText}>Gerenciar integrantes</Text>
        </Pressable>
      )}

      <TextInput
        style={styles.input}
        placeholder="Limite de integrantes"
        placeholderTextColor={colors.placeholder}
        keyboardType="number-pad"
        value={memberLimit}
        onChangeText={setMemberLimit}
      />
      <Text style={styles.slots}>Vagas disponíveis: {slots}</Text>

      <Text style={styles.sectionLabel}>Política de notificações</Text>
      {POLICIES.map((option) => (
        <Pressable key={option.value} style={styles.policyOption} onPress={() => setPolicy(option.value)}>
          <View style={[styles.radio, policy === option.value && styles.radioSelected]} />
          <Text style={styles.policyLabel}>{option.label}</Text>
        </Pressable>
      ))}

      <ErrorMessage message={formError ?? error} />

      <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar grupo'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  photoPicker: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photo: {
    width: 96,
    height: 96,
  },
  photoPlaceholder: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  slots: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  policyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
  },
  radioSelected: {
    backgroundColor: colors.primary,
  },
  policyLabel: {
    fontSize: 14,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
