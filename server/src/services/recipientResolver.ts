import { adminFirestore } from './firebaseAdmin';
import type { ChatGroupRecord, ChatMessageRecord } from '../types';

export async function resolveRecipients(message: ChatMessageRecord): Promise<string[]> {
  if (message.conversationType === 'direct') {
    const participants = message.conversationId.split('_');
    const other = participants.find((uid) => uid !== message.senderId);
    return other ? [other] : [];
  }

  const groupSnapshot = await adminFirestore.collection('groups').doc(message.conversationId).get();
  if (!groupSnapshot.exists) return [];

  const group = groupSnapshot.data() as ChatGroupRecord;
  const otherMembers = group.memberIds.filter((uid) => uid !== message.senderId);

  if (group.notificationPolicy === 'disabled' || group.notificationPolicy === 'direct_messages_only') {
    return [];
  }

  if (group.notificationPolicy === 'mentioned_members') {
    const targeted = message.target.type === 'member' ? [message.target.memberId] : [];
    const mentioned = new Set([...targeted, ...message.mentionedUserIds]);
    return otherMembers.filter((uid) => mentioned.has(uid));
  }

  return otherMembers;
}
