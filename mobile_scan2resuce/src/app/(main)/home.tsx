import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { api, type EmergencyContact } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Copy, Page, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';
import { callAndLogEmergencyHelpline } from '@/services/emergency-helplines';

function QuickAction({ title, subtitle, symbol, onPress }: { title: string; subtitle: string; symbol: 'qrcode.viewfinder' | 'person.2'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.76 }]}>
      <SymbolView name={{ ios: symbol, android: 'qr_code_scanner', web: 'qr_code_scanner' }} size={24} tintColor={C.primary} />
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session } = useSession();
  const [contactResult, setContactResult] = useState<{ token: string; contact: EmergencyContact | null; failed: boolean } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [helplineBusy, setHelplineBusy] = useState(false);
  const [helplineMessage, setHelplineMessage] = useState('');
  const [helplineError, setHelplineError] = useState('');
  const user = session?.user;
  const qrUrl = user?.publicEmergencyConsent && user.qrId ? api.emergencyCardUrl(user.qrId) : null;
  const token = session?.token;
  const contactState = contactResult?.token === token ? contactResult : null;
  const contact = contactState?.contact ?? null;
  const contactsLoaded = contactState !== null;
  const contactsLoadFailed = contactState?.failed ?? false;

  useEffect(() => {
    if (!token) return;
    let active = true;
    api.getContacts(token)
      .then(({ contacts }) => {
        if (active) setContactResult({ token, contact: contacts[0] ?? null, failed: false });
      })
      .catch(() => {
        if (active) setContactResult({ token, contact: null, failed: true });
      })
    return () => { active = false; };
  }, [token]);

  async function shareLocation() {
    setLocationError('');
    if (!contact?.phone) {
      setLocationError('Add an emergency contact before sharing your location.');
      return;
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location permission is needed to share your position.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const map = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
      const body = `I'm sharing my live location via Scan2Rescue: ${map}`;
      const separator = Platform.OS === 'ios' ? '&' : '?';
      await Linking.openURL(`sms:${contact.phone}${separator}body=${encodeURIComponent(body)}`);
    } catch (cause) {
      setLocationError(cause instanceof Error ? cause.message : 'Unable to share location.');
    }
  }

  async function callEmergencyServices() {
    if (!user?.qrId) {
      setHelplineError('Your emergency profile is not ready yet.');
      return;
    }
    setHelplineBusy(true);
    setHelplineError('');
    setHelplineMessage('Finding your state emergency number...');
    try {
      const result = await callAndLogEmergencyHelpline(user.qrId, 'owner', token);
      if (!result.dialerOpened) {
        setHelplineError(`Could not open the phone app. Call ${result.number} directly.`);
      } else if (result.reportRecorded === false) {
        setHelplineError(`Call app opened for ${result.number}, but the report could not sync.`);
      } else {
        setHelplineMessage(`Opening ${result.service} (${result.number})${result.region ? ` · ${result.region}` : ''}. The attempt is recorded for reporting.`);
      }
    } catch {
      setHelplineError('Could not prepare the emergency call. Call 112 directly.');
    } finally {
      setHelplineBusy(false);
    }
  }

  const sharingReady = Boolean(user?.publicEmergencyConsent);
  const contactReady = Boolean(contact);
  const vehicleReady = Boolean(user?.vehicle?.type && user.vehicle.registrationNumber);
  const readinessCount = Number(sharingReady) + Number(contactReady) + Number(vehicleReady);
  const readinessComplete = readinessCount === 3;
  const readinessRoute = !sharingReady
    ? '/(main)/profile-edit'
    : !contactReady
      ? '/(main)/contacts'
      : !vehicleReady
        ? '/(main)/profile-edit'
        : '/(main)/qr';
  const readinessAction = readinessComplete
    ? 'View emergency QR'
    : !sharingReady
      ? 'Enable public emergency card'
      : contactsLoadFailed
        ? 'Review emergency contacts'
        : !contactReady
          ? 'Add an emergency contact'
          : 'Complete vehicle details';

  return (
    <Page>
      <View style={styles.greeting}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hello, {user?.fullName || 'User'}</Text>
          <Copy muted>Stay safe, stay prepared.</Copy>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/(main)/profile')} style={styles.profileButton}>
          <SymbolView name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }} size={25} tintColor={C.text} />
        </Pressable>
      </View>

      <Surface style={styles.readinessCard}>
        <View style={styles.readinessHeading}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.cardTitle}>Rescue readiness</Text>
            <Copy muted>{readinessComplete ? 'Your emergency profile is ready to help responders.' : 'Complete these steps so responders can identify and reach you.'}</Copy>
          </View>
          <Text style={styles.readinessScore}>{readinessCount}/3</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 3, now: readinessCount }} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(readinessCount / 3) * 100}%`, backgroundColor: readinessComplete ? C.success : C.primary }]} />
        </View>
        <ReadinessItem label="Public emergency card" complete={sharingReady} detail={sharingReady ? 'Enabled' : 'Sharing is off'} />
        <ReadinessItem
          label="Emergency contact"
          complete={contactReady}
          pending={!contactsLoaded}
          detail={!contactsLoaded ? 'Checking' : contactsLoadFailed ? 'Could not verify' : contact?.name || (contactReady ? 'Added' : 'Not added')}
        />
        <ReadinessItem label="Vehicle details" complete={vehicleReady} detail={vehicleReady ? user?.vehicle?.registrationNumber || 'Added' : 'Not added'} />
        <ActionButton label={readinessAction} onPress={() => router.push(readinessRoute)} secondary={!readinessComplete} />
      </Surface>

      <Surface style={styles.qrCard}>
        <Text style={styles.cardTitle}>Your emergency QR code</Text>
        <View style={styles.qrWrap}>{qrUrl ? <QRCode value={qrUrl} size={168} color={C.background} backgroundColor="#FFFFFF" /> : <Text style={styles.mutedText}>{user?.publicEmergencyConsent ? 'Admin public-page URL is not configured' : 'Public sharing is off'}</Text>}</View>
        {qrUrl ? <ActionButton label="View full-screen QR" onPress={() => router.push('/(main)/qr')} /> : user?.publicEmergencyConsent ? <ActionButton label="QR unavailable" onPress={() => undefined} disabled secondary /> : <ActionButton label="Enable public card sharing" onPress={() => router.push('/(main)/profile-edit')} secondary />}
      </Surface>

      <Surface>
        <Text style={styles.cardTitle}>Get your QR sticker</Text>
        <Copy muted>Order a weather-resistant sticker for your helmet or windshield. Dispatch status and tracking appear here in your account.</Copy>
        <ActionButton label="Order a QR sticker" onPress={() => router.push('/(main)/sticker-order')} />
        <ActionButton label="Track my orders" onPress={() => router.push('/(main)/sticker-orders')} secondary />
      </Surface>

      <Surface style={{ borderColor: C.primary }}>
        <Text style={styles.cardTitle}>Emergency services</Text>
        <Copy muted>Uses your current state when location is available; otherwise calls India’s national 112 line. The number, region, and available GPS are added to the admin alert log.</Copy>
        {helplineError ? <StatusMessage message={helplineError} error /> : null}
        {helplineMessage ? <StatusMessage message={helplineMessage} /> : null}
        <ActionButton label="Call state emergency service" onPress={callEmergencyServices} busy={helplineBusy} />
      </Surface>

      <View style={styles.actions}>
        <QuickAction title="Scan QR" subtitle="Help someone" symbol="qrcode.viewfinder" onPress={() => router.push('/(main)/scan')} />
        <QuickAction title="Contacts" subtitle="Manage contacts" symbol="person.2" onPress={() => router.push('/(main)/contacts')} />
      </View>

      <Surface>
        <Text style={styles.cardTitle}>Medical summary</Text>
        <InfoRow label="Blood group" value={user?.bloodGroup} />
        <InfoRow label="Allergies" value={user?.allergies} />
        <InfoRow label="Conditions" value={user?.medicalConditions} />
      </Surface>

      <Surface>
        <Text style={styles.cardTitle}>Share your location</Text>
        <Copy muted>Compose an SMS with your current location for {contact?.name || 'your emergency contact'}.</Copy>
        {locationError ? <StatusMessage message={locationError} error /> : null}
        <ActionButton label="Share location by SMS" onPress={shareLocation} secondary />
      </Surface>
    </Page>
  );
}

function ReadinessItem({ label, complete, detail, pending = false }: { label: string; complete: boolean; detail: string; pending?: boolean }) {
  return (
    <View style={styles.readinessItem}>
      <SymbolView
        name={{ ios: complete ? 'checkmark.circle.fill' : pending ? 'clock' : 'circle', android: complete ? 'check_circle' : pending ? 'schedule' : 'radio_button_unchecked', web: complete ? 'check_circle' : pending ? 'schedule' : 'radio_button_unchecked' }}
        size={20}
        tintColor={complete ? C.success : C.muted}
      />
      <Text style={styles.readinessLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.readinessDetail}>{detail}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return <View style={styles.infoRow}><Text style={styles.mutedText}>{label}</Text><Text selectable style={styles.infoValue}>{value || 'Not specified'}</Text></View>;
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { color: C.text, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: C.surfaceRaised },
  readinessCard: { borderColor: C.primarySoft },
  readinessHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  readinessScore: { color: C.primary, fontSize: 21, fontWeight: '800', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: C.surfaceRaised },
  progressFill: { height: '100%', borderRadius: 3 },
  readinessItem: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9 },
  readinessLabel: { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  readinessDetail: { maxWidth: '42%', color: C.muted, fontSize: 12, textAlign: 'right' },
  qrCard: { alignItems: 'center', paddingVertical: 20 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  qrWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF' },
  mutedText: { color: C.muted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, minHeight: 124, padding: 16, justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.surface },
  quickTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  quickSubtitle: { color: C.muted, fontSize: 12 },
  infoRow: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  infoValue: { flex: 1, color: C.text, textAlign: 'right', fontSize: 14 },
});