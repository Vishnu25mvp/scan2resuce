import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';

import { api, type EmergencyContact } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Copy, Page, RowButton, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function ProfileScreen() {
  const { session, signOut } = useSession();
  const [contact, setContact] = useState<EmergencyContact | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const user = session?.user;
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    let active = true;
    api.getContacts(token)
      .then(({ contacts }) => { if (active) setContact(contacts[0] ?? null); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load emergency contact.'); });
    return () => { active = false; };
  }, [token]);

  function confirmLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { void logout(); } },
    ]);
  }

  async function logout() {
    setPending(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Surface>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '700' }}>{user?.fullName || 'User'}</Text>
        <Copy muted>{user?.phone || 'No phone number'}</Copy>
      </Surface>
      <Surface>
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>Personal information</Text>
        <Detail label="Full name" value={user?.fullName} />
        <Detail label="Phone" value={user?.phone} />
        <Detail label="Email" value={user?.email} />
        <Detail label="Blood group" value={user?.bloodGroup} />
      </Surface>
      <Surface>
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>Medical information</Text>
        <Detail label="Allergies" value={user?.allergies} />
        <Detail label="Medical conditions" value={user?.medicalConditions} />
      </Surface>
      <Surface>
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>Vehicle</Text>
        <Detail label="Type" value={user?.vehicle?.type} />
        <Detail label="Registration" value={user?.vehicle?.registrationNumber} />
        <Detail label="Make and model" value={user?.vehicle?.makeModel} />
        <Detail label="Color" value={user?.vehicle?.color} />
      </Surface>
      <Surface>
        <Text style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>Emergency contact</Text>
        {contact ? <><Detail label="Name" value={contact.name} /><Detail label="Phone" value={contact.phone} /><Detail label="Relation" value={contact.relation} /></> : <Copy muted>No emergency contact found.</Copy>}
        {error ? <StatusMessage message={error} error /> : null}
      </Surface>
      <RowButton label="Edit profile" detail="Personal, medical, and vehicle details" onPress={() => router.push('/(main)/profile-edit')} />
      <RowButton label="Manage emergency contacts" onPress={() => router.push('/(main)/contacts')} />
      <ActionButton label="Log out" onPress={confirmLogout} secondary busy={pending} />
    </Page>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <Text selectable style={{ color: C.text, fontSize: 14 }}>{label}: {value || 'Not specified'}</Text>;
}