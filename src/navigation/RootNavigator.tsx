import React, { useCallback, useState } from 'react';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { Loading } from '../components/Loading';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { GroupFormScreen } from '../screens/GroupFormScreen';
import { GroupMembersScreen } from '../screens/GroupMembersScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { navigationRef, navigateToChat } from './navigationRef';
import type { RootStackParamList } from '../types/navigation';
import type { PushNotificationData } from '../types/notification';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export function RootNavigator() {
  const { firebaseUser, loading } = useAuth();
  const [navigationReady, setNavigationReady] = useState(false);

  const openConversation = useCallback((data: PushNotificationData) => {
    navigateToChat(data.conversationId, data.conversationType);
  }, []);

  useNotifications(openConversation, navigationReady && !loading && firebaseUser !== null);

  if (loading) return <Loading />;

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={() => setNavigationReady(true)}>
      <Stack.Navigator screenOptions={screenOptions}>
        {firebaseUser ? (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuários' }} />
            <Stack.Screen name="GroupForm" component={GroupFormScreen} options={{ title: 'Grupo' }} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ title: 'Integrantes' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
