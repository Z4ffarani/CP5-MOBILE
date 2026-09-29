import { useEffect, useMemo, useState } from 'react';
import { listUsers } from '../services/userService';
import type { ChatUser } from '../types/user';

export function useUsers(currentUid: string | undefined, searchTerm: string) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listUsers()
      .then((result) => {
        if (active) setUsers(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar os usuários.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return users
      .filter((user) => user.uid !== currentUid)
      .filter((user) => !normalizedTerm || user.name.toLowerCase().includes(normalizedTerm) || user.email.toLowerCase().includes(normalizedTerm));
  }, [users, currentUid, searchTerm]);

  return { users: filteredUsers, loading, error };
}
