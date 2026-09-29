import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToChat(conversationId: string, conversationType: 'direct' | 'group') {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Chat', { conversationId, conversationType });
}
