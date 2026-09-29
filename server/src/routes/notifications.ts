import { Router, type Response } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { adminDatabase } from '../services/firebaseAdmin';
import { resolveRecipients } from '../services/recipientResolver';
import { sendPushNotifications } from '../services/notificationSender';
import type { ChatMessageRecord } from '../types';

export const notificationsRouter = Router();

notificationsRouter.post('/messages', authenticate, async (req, res: Response) => {
  const { uid } = req as AuthenticatedRequest;
  const { conversationId, messageId } = req.body as { conversationId?: string; messageId?: string };

  if (!conversationId || !messageId) {
    res.status(400).json({ error: 'conversationId e messageId são obrigatórios.' });
    return;
  }

  const messageRef = adminDatabase.ref(`messages/${conversationId}/${messageId}`);
  const snapshot = await messageRef.get();

  if (!snapshot.exists()) {
    res.status(404).json({ error: 'Mensagem não encontrada.' });
    return;
  }

  const message = snapshot.val() as ChatMessageRecord;

  if (message.senderId !== uid) {
    res.status(403).json({ error: 'O remetente da mensagem não corresponde ao usuário autenticado.' });
    return;
  }

  const notifiedRef = adminDatabase.ref(`messages/${conversationId}/${messageId}/notified`);
  const transactionResult = await notifiedRef.transaction((current) => {
    if (current === true) return undefined;
    return true;
  });

  if (!transactionResult.committed) {
    res.status(200).json({ status: 'already_notified' });
    return;
  }

  const recipients = await resolveRecipients(message);
  await sendPushNotifications(recipients, message);

  res.status(200).json({ status: 'sent', recipients: recipients.length });
});
