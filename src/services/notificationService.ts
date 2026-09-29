import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, setDoc } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import type { DevicePlatform, DeviceToken, PushNotificationData } from '../types/notification';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerDeviceForPush(uid: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const permission = await Notifications.getPermissionsAsync();
  let finalStatus = permission.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;
  const platform: DevicePlatform = Device.osName?.toLowerCase().includes('ios') ? 'ios' : 'android';

  const deviceToken: DeviceToken = {
    token,
    platform,
    enabled: true,
    updatedAt: Date.now(),
  };

  await setDoc(doc(firestore, 'users', uid, 'devices', token), deviceToken);
  return token;
}

export async function notifyNewMessage(conversationId: string, messageId: string): Promise<void> {
  if (!API_URL) return;

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return;

  try {
    await fetch(`${API_URL}/notifications/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ conversationId, messageId }),
    });
  } catch {
    return;
  }
}

export function addNotificationResponseListener(
  onTap: (data: PushNotificationData) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as unknown as PushNotificationData;
    onTap(data);
  });

  return () => subscription.remove();
}
