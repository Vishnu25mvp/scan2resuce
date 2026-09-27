import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { api, type Ambulance, type Hospital, type VictimInfo } from '@/api/client';
import { ActionButton, Copy, Page, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';
import { callAndLogEmergencyHelpline } from '@/services/emergency-helplines';

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

function showValue(value: string | string[]) {
  return Array.isArray(value) ? value.join(', ') : value || 'None specified';
}

async function getCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Location permission is needed to share an emergency location.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export default function VictimDetailsScreen() {
  const params = useLocalSearchParams<{ qrId: string; payload?: string }>();
  const qrId = asString(params.qrId);
  const rawPayload = asString(params.payload);
  const [victim, setVictim] = useState<VictimInfo | null>(() => {
    try { return rawPayload ? JSON.parse(rawPayload) as VictimInfo : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!rawPayload);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [resourceBusy, setResourceBusy] = useState(false);
  const [resourceError, setResourceError] = useState('');
  const [nearbySearchDone, setNearbySearchDone] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [callMessage, setCallMessage] = useState('');

  useEffect(() => {
    if (victim || !qrId) return;
    let active = true;
    api.getVictimInfo(qrId)
      .then((info) => { if (active) setVictim(info); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load victim details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [qrId, victim, reloadKey]);

  async function dispatchAlert() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const coordinates = await getCoordinates();
      const result = await api.createAlert({ qrId, ...coordinates, type: 'sms_location' });
      const list = await api.getHospitals();
      setHospitals(Array.isArray(list) ? list : list.hospitals ?? []);
      setMessage(result.message || 'Emergency alert sent.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send emergency alert.');
    } finally {
      setBusy(false);
    }
  }

  async function callContact() {
    const phone = victim?.emergencyContacts?.[0]?.phone;
    if (!phone) {
      setError('No emergency contact phone number is available.');
      return;
    }
    try {
      void api.createAlert({ qrId, type: 'call' }).catch(() => undefined);
      await Linking.openURL(`tel:${phone}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the call.');
    }
  }

  async function callStateHelpline() {
    setBusy(true);
    setError('');
    setMessage('Finding the local emergency number...');
    try {
      const result = await callAndLogEmergencyHelpline(qrId, 'bystander');
      if (!result.dialerOpened) {
        setError(`Could not open the phone app. Call ${result.number} directly.`);
        setMessage('');
      } else if (result.reportRecorded === false) {
        setError(`Call app opened for ${result.number}, but the report could not sync.`);
        setMessage('');
      } else {
        setCallMessage(`Opening ${result.service} (${result.number})${result.region ? ` · ${result.region}` : ''}.`);
        setMessage('Emergency call attempt recorded for admin reporting.');
      }
    } catch {
      setError('Could not prepare the emergency call. Call 112 directly.');
      setMessage('');
    } finally {
      setBusy(false);
    }
  }

  async function textLocation() {
    const phone = victim?.emergencyContacts?.[0]?.phone;
    if (!phone) {
      setError('No emergency contact phone number is available.');
      return;
    }
    setError('');
    try {
      let coordinates: { latitude: number; longitude: number } | undefined;
      try { coordinates = await getCoordinates(); } catch { coordinates = undefined; }
      void api.createAlert({ qrId, ...coordinates, type: 'sms_location' }).catch(() => undefined);
      const locationText = coordinates
        ? ` Victim location: https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}.`
        : '';
      const body = `Emergency alert from Scan2Rescue.${locationText} Please respond immediately.`;
      const separator = Platform.OS === 'ios' ? '&' : '?';
      await Linking.openURL(`sms:${phone}${separator}body=${encodeURIComponent(body)}`);
    } catch {
      setError('Could not open the messaging app.');
    }
  }

  async function findNearbyHelp() {
    setResourceBusy(true);
    setResourceError('');
    try {
      const coordinates = await getCoordinates();
      const [hospitalResult, ambulanceResult] = await Promise.allSettled([
        api.getNearbyHospitals(coordinates.latitude, coordinates.longitude),
        api.getNearbyAmbulances(coordinates.latitude, coordinates.longitude),
      ]);
      const nextHospitals = hospitalResult.status === 'fulfilled' ? hospitalResult.value : [];
      const nextAmbulances = ambulanceResult.status === 'fulfilled' ? ambulanceResult.value : [];
      setNearbyHospitals(nextHospitals);
      setAmbulances(nextAmbulances);
      setNearbySearchDone(true);
      if (hospitalResult.status === 'rejected' && ambulanceResult.status === 'rejected') {
        throw new Error('Nearby emergency services are unavailable. Check your connection and try again.');
      }
      if (hospitalResult.status === 'rejected' || ambulanceResult.status === 'rejected') {
        setResourceError('Some nearby services could not be loaded.');
      }
    } catch (cause) {
      setResourceError(cause instanceof Error ? cause.message : 'Could not find nearby emergency services.');
    } finally {
      setResourceBusy(false);
    }
  }

  async function callService(phone: string) {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      setResourceError('Could not open the phone app.');
    }
  }

  if (loading) return <Page><StatusMessage message="Loading victim information..." /></Page>;
  if (!victim) return <Page><StatusMessage message={error || 'Victim information is unavailable.'} error /><ActionButton label="Try again" onPress={() => { setVictim(null); setLoading(true); setError(''); setReloadKey((value) => value + 1); }} secondary /></Page>;

  const contacts = victim.emergencyContacts ?? [];
  return (
    <Page>
      <Surface style={{ borderColor: C.primary }}>
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '800' }}>Emergency information</Text>
        <Detail label="Name" value={victim.fullName} />
        <Detail label="Blood group" value={victim.bloodGroup} />
        <Detail label="Allergies" value={showValue(victim.allergies)} />
        <Detail label="Medical conditions" value={showValue(victim.medicalConditions)} />
      </Surface>
      <Surface>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Emergency contacts</Text>
        {contacts.length ? contacts.map((contact, index) => (
          <View key={`${contact.phone}-${index}`} style={{ gap: 4 }}>
            <Text style={{ color: C.text, fontWeight: '700' }}>{contact.name}</Text>
            <Copy muted>{contact.phone} · {contact.relation}</Copy>
          </View>
        )) : <Copy muted>No emergency contacts listed.</Copy>}
      </Surface>
      <Surface>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Emergency response</Text>
        <Copy muted>Dispatch shares your current GPS coordinates with the emergency service.</Copy>
        {hospitals.length ? <View style={{ gap: 6 }}><Text style={{ color: C.text, fontWeight: '700' }}>Nearby hospitals</Text>{hospitals.slice(0, 3).map((hospital, index) => <Copy key={`${hospital.name}-${index}`} muted>{hospital.name || 'Hospital'}{hospital.address ? ` · ${hospital.address}` : ''}</Copy>)}</View> : null}
        {error ? <StatusMessage message={error} error /> : null}
        {message ? <StatusMessage message={message} /> : null}
        {callMessage ? <StatusMessage message={callMessage} /> : null}
        <ActionButton label="Find nearby emergency services" onPress={findNearbyHelp} busy={resourceBusy} secondary />
        {resourceError ? <StatusMessage message={resourceError} error /> : null}
        {(nearbyHospitals.length > 0 || ambulances.length > 0) ? (
          <View style={{ gap: 10 }}>
            {ambulances.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: C.text, fontWeight: '700' }}>Nearby ambulances</Text>
                {ambulances.slice(0, 3).map((ambulance, index) => (
                  <ResourceRow key={`${ambulance.name}-${index}`} item={ambulance} onCall={callService} />
                ))}
              </View>
            ) : null}
            {nearbyHospitals.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: C.text, fontWeight: '700' }}>Nearby hospitals</Text>
                {nearbyHospitals.slice(0, 3).map((hospital, index) => (
                  <ResourceRow key={`${hospital.name}-${index}`} item={hospital} onCall={callService} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        {!resourceBusy && !resourceError && nearbySearchDone && nearbyHospitals.length === 0 && ambulances.length === 0 ? (
          <StatusMessage message="No nearby ambulance or hospital listings were found." />
        ) : null}
        <ActionButton label="Call state emergency service" onPress={callStateHelpline} busy={busy} />
        <ActionButton label="Send emergency alert" onPress={dispatchAlert} busy={busy} />
        <ActionButton label="Call emergency contact" onPress={callContact} secondary />
        <ActionButton label="Text location to contact" onPress={textLocation} secondary />
      </Surface>
    </Page>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text><Text selectable style={{ color: C.text, fontSize: 15 }}>{value || 'Not specified'}</Text></View>;
}

function ResourceRow({ item, onCall }: { item: Hospital | Ambulance; onCall: (phone: string) => void }) {
  const phone = item.phone;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{item.name || 'Emergency service'}</Text>
        <Copy muted>{[item.address, item.distanceKm === undefined ? '' : `${item.distanceKm.toFixed(1)} km`].filter(Boolean).join(' · ') || 'Location details unavailable'}</Copy>
      </View>
      {phone ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Call ${item.name || 'emergency service'} at ${phone}`} onPress={() => onCall(phone)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text selectable style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>{phone}</Text>
        </Pressable>
      ) : <Copy muted>No phone</Copy>}
    </View>
  );
}