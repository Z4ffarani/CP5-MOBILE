import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { uploadGroupPhoto } from './storageService';
import { isValidMemberLimit, hasAvailableSlot } from '../utils/groupValidation';
import type { ChatGroup, CreateGroupInput, NotificationPolicy } from '../types/group';

const GROUPS_COLLECTION = 'groups';

export async function createGroup(ownerId: string, input: CreateGroupInput): Promise<ChatGroup> {
  const memberIds = Array.from(new Set([ownerId, ...input.memberIds]));

  if (!isValidMemberLimit(input.memberLimit, memberIds.length)) {
    throw new Error('Limite de integrantes inválido para a quantidade selecionada.');
  }

  const groupRef = doc(collection(firestore, GROUPS_COLLECTION));
  const now = Date.now();

  const photoUrl = input.photoUri ? await uploadGroupPhoto(groupRef.id, input.photoUri) : '';

  const group: ChatGroup = {
    id: groupRef.id,
    name: input.name,
    photoUrl,
    ownerId,
    memberIds,
    memberLimit: input.memberLimit,
    notificationPolicy: input.notificationPolicy,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(groupRef, group);
  return group;
}

export async function getGroup(groupId: string): Promise<ChatGroup | null> {
  const snapshot = await getDoc(doc(firestore, GROUPS_COLLECTION, groupId));
  return snapshot.exists() ? (snapshot.data() as ChatGroup) : null;
}

export async function listGroupsForUser(uid: string): Promise<ChatGroup[]> {
  const groupsQuery = query(collection(firestore, GROUPS_COLLECTION), where('memberIds', 'array-contains', uid));
  const snapshot = await getDocs(groupsQuery);
  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as ChatGroup);
}

export async function updateMemberLimit(groupId: string, requesterId: string, newLimit: number): Promise<void> {
  const groupRef = doc(firestore, GROUPS_COLLECTION, groupId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(groupRef);
    if (!snapshot.exists()) throw new Error('Grupo não encontrado.');

    const group = snapshot.data() as ChatGroup;
    if (group.ownerId !== requesterId) throw new Error('Somente o proprietário pode alterar o limite.');
    if (!isValidMemberLimit(newLimit, group.memberIds.length)) {
      throw new Error('O novo limite não pode ser menor que a quantidade atual de integrantes.');
    }

    transaction.update(groupRef, { memberLimit: newLimit, updatedAt: Date.now() });
  });
}

export async function addMember(groupId: string, newMemberId: string): Promise<void> {
  const groupRef = doc(firestore, GROUPS_COLLECTION, groupId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(groupRef);
    if (!snapshot.exists()) throw new Error('Grupo não encontrado.');

    const group = snapshot.data() as ChatGroup;
    if (group.memberIds.includes(newMemberId)) return;
    if (!hasAvailableSlot(group.memberLimit, group.memberIds)) {
      throw new Error('O grupo atingiu o limite máximo de integrantes.');
    }

    transaction.update(groupRef, {
      memberIds: arrayUnion(newMemberId),
      updatedAt: Date.now(),
    });
  });
}

export async function removeMember(groupId: string, requesterId: string, memberId: string): Promise<void> {
  const groupRef = doc(firestore, GROUPS_COLLECTION, groupId);
  const snapshot = await getDoc(groupRef);
  if (!snapshot.exists()) throw new Error('Grupo não encontrado.');

  const group = snapshot.data() as ChatGroup;
  if (group.ownerId !== requesterId) throw new Error('Somente o proprietário pode remover integrantes.');
  if (memberId === group.ownerId) throw new Error('O proprietário não pode ser removido do grupo.');

  await updateDoc(groupRef, {
    memberIds: arrayRemove(memberId),
    updatedAt: Date.now(),
  });
}

export async function updateNotificationPolicy(
  groupId: string,
  requesterId: string,
  policy: NotificationPolicy,
): Promise<void> {
  const groupRef = doc(firestore, GROUPS_COLLECTION, groupId);
  const snapshot = await getDoc(groupRef);
  if (!snapshot.exists()) throw new Error('Grupo não encontrado.');

  const group = snapshot.data() as ChatGroup;
  if (group.ownerId !== requesterId) throw new Error('Somente o proprietário pode alterar a política de notificações.');

  await updateDoc(groupRef, { notificationPolicy: policy, updatedAt: Date.now() });
}
