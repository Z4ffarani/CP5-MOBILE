import { useCallback, useEffect, useRef } from 'react';
import { addNotificationResponseListener, getInitialNotificationTap } from '../services/notificationService';
import type { NotificationTap, PushNotificationData } from '../types/notification';

// `ready` indica que a navegação está montada e há usuário autenticado; toques anteriores a isso ficam pendentes.
export function useNotifications(onTap: (data: PushNotificationData) => void, ready: boolean) {
  const handledIdsRef = useRef(new Set<string>());
  const pendingRef = useRef<PushNotificationData | null>(null);

  const handleTap = useCallback(
    (tap: NotificationTap) => {
      if (handledIdsRef.current.has(tap.id)) return;
      handledIdsRef.current.add(tap.id);

      if (ready) onTap(tap.data);
      else pendingRef.current = tap.data;
    },
    [ready, onTap],
  );

  useEffect(() => addNotificationResponseListener(handleTap), [handleTap]);

  useEffect(() => {
    if (!ready) return;

    const initialTap = getInitialNotificationTap();
    if (initialTap) handleTap(initialTap);

    if (pendingRef.current) {
      onTap(pendingRef.current);
      pendingRef.current = null;
    }
  }, [ready, handleTap, onTap]);
}
