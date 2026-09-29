import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { getGroup } from '../services/groupService';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { PhotoPicker } from '../components/PhotoPicker';
import { Icon, type IconName } from '../components/Icon';
import { availableSlots } from '../utils/groupValidation';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';
import type { ChatGroup, NotificationPolicy } from '../types/group';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupForm'>;

const POLICIES: { value: NotificationPolicy; label: string; description: string; icon: IconName }[] = [
  {
    value: 'all_group_messages',
    label: 'Todas as mensagens do grupo',
    description: 'Todos os integrantes são notificados.',
    icon: 'notifications-outline',
  },
  {
    value: 'mentioned_members',
    label: 'Somente integrantes mencionados',
    description: 'Apenas quem for mencionado recebe o aviso.',
    icon: 'at-outline',
  },
  {
    value: 'direct_messages_only',
    label: 'Somente mensagens diretas',
    description: 'Mensagens deste grupo não geram notificação.',
    icon: 'person-outline',
  },
  {
    value: 'disabled',
    label: 'Desativado',
    description: 'Nenhuma notificação para este grupo.',
    icon: 'notifications-off-outline',
  },
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
    getGroup(groupId)
      .then((group) => {
        setExistingGroup(group);
        if (group) {
          setName(group.name);
          setMemberLimit(String(group.memberLimit));
          setPolicy(group.notificationPolicy);
          setMemberIds(group.memberIds);
        }
      })
      .catch(() => setFormError('Não foi possível carregar o grupo.'))
      .finally(() => setLoadingGroup(false));
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isEditing ? `Editar ${existingGroup?.name ?? 'grupo'}` : 'Novo grupo'}</Text>

      {!isEditing ? (
        <>
          <PhotoPicker
            uri={photoUri}
            placeholderIcon="people"
            label={photoUri ? 'Toque para trocar a foto' : 'Adicionar foto do grupo'}
            onPress={pickPhoto}
          />

          <TextField icon="chatbubbles-outline" placeholder="Nome do grupo" value={name} onChangeText={setName} />

          <Button
            label={`Selecionar integrantes (${memberIds.length})`}
            icon="person-add-outline"
            variant="outline"
            onPress={() => navigation.navigate('Users', { selectForGroup: true, initialSelectedIds: memberIds })}
            style={styles.spaced}
          />
        </>
      ) : (
        <Button
          label="Gerenciar integrantes"
          icon="people-outline"
          variant="outline"
          onPress={() => existingGroup && navigation.navigate('GroupMembers', { groupId: existingGroup.id })}
          style={styles.spaced}
        />
      )}

      <Text style={styles.sectionLabel}>Limite de integrantes</Text>
      <TextField
        icon="people-circle-outline"
        placeholder="Limite de integrantes"
        keyboardType="number-pad"
        value={memberLimit}
        onChangeText={setMemberLimit}
      />
      <View style={styles.slotsRow}>
        <Icon name="information-circle-outline" size={16} color={slots === 0 ? colors.danger : colors.textSecondary} />
        <Text style={[styles.slots, slots === 0 && styles.slotsFull]}>
          {slots === 0 ? 'Sem vagas disponíveis' : `Vagas disponíveis: ${slots}`}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Política de notificações</Text>
      {POLICIES.map((option) => {
        const selected = policy === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.policyOption, selected && styles.policyOptionSelected]}
            onPress={() => setPolicy(option.value)}
          >
            <View style={[styles.policyIcon, selected && styles.policyIconSelected]}>
              <Icon name={option.icon} size={18} color={selected ? colors.onPrimary : colors.primarySoftText} />
            </View>
            <View style={styles.policyText}>
              <Text style={styles.policyLabel}>{option.label}</Text>
              <Text style={styles.policyDescription}>{option.description}</Text>
            </View>
            <Icon
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? colors.primary : colors.placeholder}
            />
          </Pressable>
        );
      })}

      <ErrorMessage message={formError ?? error} />

      <Button
        label={saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar grupo'}
        icon={isEditing ? 'save-outline' : 'checkmark-circle-outline'}
        onPress={handleSubmit}
        loading={saving}
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  spaced: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 20,
  },
  slots: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  slotsFull: {
    color: colors.danger,
  },
  policyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  policyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  policyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyIconSelected: {
    backgroundColor: colors.primary,
  },
  policyText: {
    flex: 1,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  policyDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submit: {
    marginTop: 16,
    marginBottom: 12,
  },
});
