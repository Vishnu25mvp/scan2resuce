import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Field, OptionField, Page, StatusMessage, Surface } from '@/components/rescue-ui';

const relations = ['Parent', 'Sibling', 'Spouse', 'Friend', 'Other'];

export default function ContactFormScreen() {
  const { session } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || phone.replace(/\D/g, '').length < 7) {
      setError('Enter a contact name and valid phone number.');
      return;
    }
    if (!session) return;
    setPending(true);
    setError('');
    try {
      await api.addContact({ name: name.trim(), phone: phone.trim(), relation }, session.token);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add contact.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Surface>
        <Field label="Contact name" value={name} onChangeText={setName} />
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <OptionField label="Relation" value={relation} options={relations} onValueChange={setRelation} />
      </Surface>
      {error ? <StatusMessage message={error} error /> : null}
      <ActionButton label="Add contact" onPress={submit} busy={pending} />
      <ActionButton label="Cancel" onPress={() => router.back()} secondary />
    </Page>
  );
}