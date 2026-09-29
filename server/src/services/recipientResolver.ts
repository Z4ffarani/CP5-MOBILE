import type { ChatMessageRecord, ConversationContext } from '../types';

export function resolveRecipients(conversation: ConversationContext, message: ChatMessageRecord): string[] {
  const otherParticipants = conversation.participantIds.filter((uid) => uid !== message.senderId);

  if (conversation.type === 'direct') return otherParticipants;

  if (conversation.notificationPolicy === 'disabled' || conversation.notificationPolicy === 'direct_messages_only') {
    return [];
  }

  if (conversation.notificationPolicy === 'mentioned_members') {
    const targeted = message.target.type === 'member' ? [message.target.memberId] : [];
    const mentioned = new Set([...targeted, ...(message.mentionedUserIds ?? [])]);
    return otherParticipants.filter((uid) => mentioned.has(uid));
  }

  return otherParticipants;
}
