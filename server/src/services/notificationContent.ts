import type { ChatMessageRecord, ConversationContext, NotificationContent } from '../types';

// O texto da mensagem nunca vai para a notificação: ela aparece na tela bloqueada e na central de notificações,
// então informa apenas quem enviou e em qual conversa. O conteúdo só é visto dentro do app.
export function buildNotificationContent(
  conversation: ConversationContext,
  message: ChatMessageRecord,
  senderName: string,
  recipientUid: string,
): NotificationContent {
  if (conversation.type === 'direct') {
    return { title: senderName, body: 'Enviou uma nova mensagem' };
  }

  const targeted = message.target.type === 'member' && message.target.memberId === recipientUid;
  const mentioned = targeted || (message.mentionedUserIds ?? []).includes(recipientUid);

  return {
    title: conversation.groupName,
    body: mentioned ? `${senderName} mencionou você` : `${senderName} enviou uma nova mensagem`,
  };
}
