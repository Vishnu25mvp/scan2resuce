import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/auth/session';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function AuthLayout() {
  const { loading, session } = useSession();
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.primary} /></View>;
  if (session) return <Redirect href="/(main)/home" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background } }} />;
}