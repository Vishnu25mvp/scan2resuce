import { useSession } from '@/auth/session';
import { router } from 'expo-router';
import { ActionButton, Copy, Page } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';

export default function MyQrScreen() {
  const { session } = useSession();
  const sharingEnabled = session?.user.publicEmergencyConsent === true;
  const url = sharingEnabled && session?.user.qrId ? api.emergencyCardUrl(session.user.qrId) : null;
  return (
    <Page scroll={false}>
      <View style={styles.content}>
        <Text style={styles.title}>{url ? 'Emergency card' : sharingEnabled ? 'Public page URL missing' : 'Public sharing is off'}</Text>
        {url ? <><View style={styles.qrFrame}><QRCode value={url} size={240} color={C.background} backgroundColor="#FFFFFF" /></View><Copy style={styles.url}>{url}</Copy></> : <><Copy muted>{sharingEnabled ? 'Configure EXPO_PUBLIC_PUBLIC_CARD_BASE_URL to the admin-panel origin and rebuild the app before printing this QR.' : 'Enable public emergency-card sharing in your profile before printing or using this QR code.'}</Copy>{!sharingEnabled && <ActionButton label="Review sharing settings" onPress={() => router.push('/(main)/profile-edit')} />}</>}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { color: C.text, fontSize: 19, fontWeight: '700' },
  qrFrame: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF' },
  url: { maxWidth: 340, textAlign: 'center', fontSize: 12 },
});