import { useCallback, useState } from 'react';
import {
  createGroup,
  updateMemberLimit,
  addMember,
  removeMember,
  updateNotificationPolicy,
} from '../services/groupService';
import type { ChatGroup, CreateGroupInput, NotificationPolicy } from '../types/group';

export function useGroups() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (ownerId: string, input: CreateGroupInput): Promise<ChatGroup | null> => {
    setSaving(true);
    setError(null);
    try {
      return await createGroup(ownerId, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o grupo.');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const changeLimit = useCallback(async (groupId: string, requesterId: string, newLimit: number) => {
    setSaving(true);
    setError(null);
    try {
      await updateMemberLimit(groupId, requesterId, newLimit);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar o limite.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const addGroupMember = useCallback(async (groupId: string, memberId: string) => {
    setSaving(true);
    setError(null);
    try {
      await addMember(groupId, memberId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível adicionar o integrante.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeGroupMember = useCallback(async (groupId: string, requesterId: string, memberId: string) => {
    setSaving(true);
    setError(null);
    try {
      await removeMember(groupId, requesterId, memberId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover o integrante.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const changePolicy = useCallback(async (groupId: string, requesterId: string, policy: NotificationPolicy) => {
    setSaving(true);
    setError(null);
    try {
      await updateNotificationPolicy(groupId, requesterId, policy);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a política de notificações.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, error, create, changeLimit, addGroupMember, removeGroupMember, changePolicy };
}
