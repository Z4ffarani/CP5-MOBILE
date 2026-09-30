import { adminFirestore } from './firebaseAdmin';
import type { ChatMessageRecord, DeviceTokenRecord, NotificationContent } from '../types';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type ExpoPushTicket = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

async function collectTokens(uids: string[]): Promise<{ uid: string; token: string }[]> {
  const results = await Promise.all(
    uids.map(async (uid) => {
      const devicesSnapshot = await adminFirestore
        .collection('users')
        .doc(uid)
        .collection('devices')
        .where('enabled', '==', true)
        .get();

      return devicesSnapshot.docs.map((docSnapshot) => ({
        uid,
        token: (docSnapshot.data() as DeviceTokenRecord).token,
      }));
    }),
  );

  return results.flat();
}

async function disableToken(uid: string, token: string): Promise<void> {
  await adminFirestore.collection('users').doc(uid).collection('devices').doc(token).update({ enabled: false });
}

export async function sendPushNotifications(
  recipientUids: string[],
  message: ChatMessageRecord,
  contentFor: (recipientUid: string) => NotificationContent,
): Promise<void> {
  if (recipientUids.length === 0) return;

  const tokens = await collectTokens(recipientUids);
  if (tokens.length === 0) return;

  const notifications = tokens.map(({ uid, token }) => ({
    to: token,
    ...contentFor(uid),
    data: {
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      messageId: message.id,
    },
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notifications),
  });

  const payload = (await response.json()) as { data?: ExpoPushTicket[] };
  const tickets = payload.data ?? [];

  await Promise.all(
    tickets.map(async (ticket, index) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        await disableToken(tokens[index].uid, tokens[index].token);
      }
    }),
  );
}
