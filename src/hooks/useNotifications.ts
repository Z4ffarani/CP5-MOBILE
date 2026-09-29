import { useEffect } from 'react';
import { addNotificationResponseListener } from '../services/notificationService';
import type { PushNotificationData } from '../types/notification';

export function useNotifications(onTap: (data: PushNotificationData) => void) {
  useEffect(() => {
    const unsubscribe = addNotificationResponseListener(onTap);
    return unsubscribe;
  }, [onTap]);
}
