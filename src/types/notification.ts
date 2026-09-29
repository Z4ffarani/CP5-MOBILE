import type { NotificationPolicy } from './group';

export type NotificationSettings = {
  conversationId: string;
  policy: NotificationPolicy;
  updatedBy: string;
  updatedAt: number;
};

export type DevicePlatform = 'android' | 'ios' | 'web';

export type DeviceToken = {
  token: string;
  platform: DevicePlatform;
  enabled: boolean;
  updatedAt: number;
};

export type PushNotificationData = {
  conversationId: string;
  conversationType: 'direct' | 'group';
  messageId: string;
};

export type NotificationTap = {
  id: string;
  data: PushNotificationData;
};

export type PushRegistrationStatus = 'pending' | 'registered' | 'denied' | 'unavailable' | 'error';

export type PushRegistration = {
  status: Exclude<PushRegistrationStatus, 'pending'>;
  token: string | null;
};
