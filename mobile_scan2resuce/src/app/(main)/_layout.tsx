import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/auth/session';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function MainLayout() {
  const { loading, session } = useSession();
  if (loading) return <View style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.primary} /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: C.background },
      headerTintColor: C.text,
      headerTitleStyle: { color: C.text, fontWeight: '700' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: C.background },
    }}>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'My profile' }} />
      <Stack.Screen name="profile-edit" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="sticker-order" options={{ title: 'Order QR sticker' }} />
      <Stack.Screen name="sticker-orders" options={{ title: 'Sticker orders' }} />
      <Stack.Screen name="contacts" options={{ title: 'Emergency contacts' }} />
      <Stack.Screen name="contact-form" options={{ title: 'Add contact', presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.65, 1] }} />
      <Stack.Screen name="qr" options={{ title: 'My QR code' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan QR code' }} />
      <Stack.Screen name="victim/[qrId]" options={{ title: 'Victim information' }} />
    </Stack>
  );
}