import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { api, type VictimInfo } from '@/api/client';
import { ActionButton, Copy } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

function getQrId(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.pathname.split('/').filter(Boolean).at(-1) || value;
  } catch {
    return value;
  }
}

function readOfflinePayload(value: string): VictimInfo | null {
  try {
    const payload = JSON.parse(value) as Record<string, unknown>;
    const profile = (payload.profile ?? {}) as Record<string, unknown>;
    return {
      fullName: String(profile.fullName ?? payload.fullName ?? payload.name ?? 'Unknown'),
      bloodGroup: String(profile.bloodGroup ?? payload.bloodGroup ?? 'Not specified'),
      allergies: (profile.allergies ?? payload.allergies ?? '') as string | string[],
      medicalConditions: (profile.medicalConditions ?? payload.medicalConditions ?? '') as string | string[],
      emergencyContacts: (profile.emergencyContacts ?? payload.emergencyContacts ?? []) as VictimInfo['emergencyContacts'],
    };
  } catch {
    return null;
  }
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    setBusy(false);
  }, []));

  async function onScan(value: string) {
    if (busy || !value.trim()) return;
    setBusy(true);
    const qrId = getQrId(value.trim());
    try {
      let victim: VictimInfo;
      try {
        victim = await api.getVictimInfo(qrId);
      } catch (error) {
        const offline = readOfflinePayload(value);
        if (!offline) throw error;
        victim = offline;
      }
      router.push({ pathname: '/(main)/victim/[qrId]', params: { qrId, payload: JSON.stringify(victim) } });
    } catch (cause) {
      Alert.alert('Scan failed', cause instanceof Error ? cause.message : 'Could not read this QR code.', [
        { text: 'Try again', onPress: () => setBusy(false) },
      ]);
      return;
    }
    setBusy(false);
  }

  if (!permission) return <View style={styles.message}><ActivityIndicator color={C.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.message}>
        <Text style={styles.title}>Camera access needed</Text>
        <Copy muted>Allow camera access to scan an emergency QR code.</Copy>
        <ActionButton label="Allow camera" onPress={() => { void requestPermission(); }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={busy ? undefined : ({ data }) => { void onScan(data); }}
      />
      <View pointerEvents="none" style={styles.frame} />
      <View style={styles.bottom}>
        {busy ? <ActivityIndicator color={C.text} /> : null}
        <Text style={styles.instruction}>{busy ? 'Fetching emergency information...' : 'Align a QR code inside the frame'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  message: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: C.background },
  title: { color: C.text, fontSize: 21, fontWeight: '700' },
  frame: { width: 250, aspectRatio: 1, borderWidth: 3, borderColor: C.primary, borderRadius: 14 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.surface },
  instruction: { color: C.muted, fontSize: 14, textAlign: 'center' },
});