import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from '@/auth/session';
import { RescueColors } from '@/constants/rescue-theme';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: RescueColors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </SessionProvider>
  );
}
