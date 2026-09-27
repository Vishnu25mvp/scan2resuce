import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { api, type EmergencyContact } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Copy, Page, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

export default function ContactsScreen() {
  const { session } = useSession();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const token = session?.token;

  const loadContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.getContacts(token);
      setContacts(result.contacts ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load contacts.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void loadContacts(); }, [loadContacts]));

  async function removeContact(contact: EmergencyContact) {
    if (!session) return;
    const id = contact._id || contact.id;
    if (!id) return;
    setDeleting(id);
    setError('');
    try {
      await api.deleteContact(id, session.token);
      setContacts((items) => items.filter((item) => (item._id || item.id) !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete contact.');
    } finally {
      setDeleting('');
    }
  }

  function askRemove(contact: EmergencyContact) {
    if (contacts.length <= 1) {
      setError('At least one emergency contact is required.');
      return;
    }
    Alert.alert('Remove contact?', `Remove ${contact.name} from your emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { void removeContact(contact); } },
    ]);
  }

  return (
    <Page>
      <View style={{ gap: 6 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '700' }}>Emergency contacts</Text>
        <Copy muted>People responders can reach if you need help.</Copy>
      </View>
      {loading ? <StatusMessage message="Loading contacts..." /> : null}
      {error ? <StatusMessage message={error} error /> : null}
      {!loading && !error && contacts.length === 0 ? <Surface><Copy muted>No emergency contacts yet.</Copy></Surface> : null}
      {contacts.map((contact) => {
        const id = contact._id || contact.id || contact.phone;
        return (
          <Surface key={id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{contact.name}</Text>
                <Text selectable style={{ color: C.muted }}>{contact.phone}</Text>
                <Text style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>{contact.relation}</Text>
              </View>
              <Text accessibilityRole="button" onPress={() => askRemove(contact)} style={{ color: C.danger, padding: 6 }}>
                {deleting === contact._id ? 'Removing...' : 'Remove'}
              </Text>
            </View>
          </Surface>
        );
      })}
      <ActionButton label="Add emergency contact" onPress={() => router.push('/(main)/contact-form')} />
      {error && !loading ? <ActionButton label="Try again" onPress={() => { void loadContacts(); }} secondary /> : null}
    </Page>
  );
}