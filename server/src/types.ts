export type NotificationPolicy =
  | 'all_group_messages'
  | 'mentioned_members'
  | 'direct_messages_only'
  | 'disabled';

export type MessageTarget =
  | { type: 'conversation' }
  | { type: 'member'; memberId: string };

export type ChatMessageRecord = {
  id: string;
  conversationId: string;
  conversationType: 'direct' | 'group';
  senderId: string;
  text: string;
  target: MessageTarget;
  // O Realtime Database não armazena arrays vazios, então o campo pode vir ausente na leitura.
  mentionedUserIds?: string[];
  createdAt: number;
};

export type ChatGroupRecord = {
  ownerId: string;
  memberIds: string[];
  notificationPolicy: NotificationPolicy;
};

export type ConversationContext =
  | { type: 'direct'; participantIds: string[] }
  | { type: 'group'; participantIds: string[]; notificationPolicy: NotificationPolicy };

export type DeviceTokenRecord = {
  token: string;
  platform: 'android' | 'ios' | 'web';
  enabled: boolean;
};
