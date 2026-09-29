import type { ConversationType } from './chat';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Conversations: undefined;
  Users: { selectForGroup?: boolean; initialSelectedIds?: string[]; groupId?: string } | undefined;
  GroupForm: { groupId?: string; selectedMemberIds?: string[] } | undefined;
  Chat: { conversationId: string; conversationType: ConversationType };
  Profile: { uid: string };
  GroupMembers: { groupId: string };
};
