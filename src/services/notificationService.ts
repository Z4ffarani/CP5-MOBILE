import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { authorizedFetch, isApiConfigured } from './apiClient';
import type {
  DevicePlatform,
  DeviceToken,
  NotificationTap,
  PushNotificationData,
  PushRegistration,
} from '../types/notification';

const ANDROID_CHANNEL_ID = 'default';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function getProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

// Nunca lança exceção: falhas de permissão, de ambiente ou de rede viram um status tratado pela interface.
export async function registerDeviceForPush(uid: string): Promise<PushRegistration> {
  if (Platform.OS === 'web' || !Device.isDevice) return { status: 'unavailable', token: null };

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Mensagens',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const permission = await Notifications.getPermissionsAsync();
    let finalStatus = permission.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') return { status: 'denied', token: null };

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenResponse.data;
    const platform: DevicePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

    const deviceToken: DeviceToken = {
      token,
      platform,
      enabled: true,
      updatedAt: Date.now(),
    };

    await setDoc(doc(firestore, 'users', uid, 'devices', token), deviceToken);
    return { status: 'registered', token };
  } catch {
    return { status: 'error', token: null };
  }
}

// Chamado antes do signOut (enquanto as regras ainda reconhecem o usuário), para o aparelho parar de receber push da conta.
export async function unregisterDeviceForPush(uid: string, token: string): Promise<void> {
  try {
    await setDoc(doc(firestore, 'users', uid, 'devices', token), { enabled: false, updatedAt: Date.now() }, { merge: true });
  } catch {
    return;
  }
}

export async function notifyNewMessage(conversationId: string, messageId: string): Promise<void> {
  if (!isApiConfigured()) return;

  try {
    await authorizedFetch('/notifications/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, messageId }),
    });
  } catch {
    return;
  }
}

function toNotificationTap(response: Notifications.NotificationResponse): NotificationTap {
  return {
    id: response.notification.request.identifier,
    data: response.notification.request.content.data as unknown as PushNotificationData,
  };
}

export function addNotificationResponseListener(onTap: (tap: NotificationTap) => void): () => void {
  if (Platform.OS === 'web') return () => undefined;

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(toNotificationTap(response));
  });

  return () => subscription.remove();
}

// Toque que abriu o app a partir do estado fechado (cold start), entregue antes de o listener existir.
export function getInitialNotificationTap(): NotificationTap | null {
  if (Platform.OS === 'web') return null;

  try {
    const response = Notifications.getLastNotificationResponse();
    return response ? toNotificationTap(response) : null;
  } catch {
    return null;
  }
}
