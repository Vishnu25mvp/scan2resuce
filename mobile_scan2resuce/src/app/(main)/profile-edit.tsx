import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, ConsentField, Field, OptionField, Page, StatusMessage, Surface } from '@/components/rescue-ui';

const bloodGroups = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const vehicleTypes = ['', 'Motorcycle', 'Scooter', 'Car', 'Van', 'Other'];

export default function EditProfileScreen() {
  const { session, updateUser } = useSession();
  const user = session?.user;
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '', email: user?.email ?? '', bloodGroup: user?.bloodGroup ?? '',
    allergies: user?.allergies ?? '', medicalConditions: user?.medicalConditions ?? '',
    vehicleType: user?.vehicle?.type ?? '', registrationNumber: user?.vehicle?.registrationNumber ?? '',
    makeModel: user?.vehicle?.makeModel ?? '', vehicleColor: user?.vehicle?.color ?? '',
  });
  const [publicEmergencyConsent, setPublicEmergencyConsent] = useState(user?.publicEmergencyConsent ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved('');
  }

  async function submit() {
    if (!form.fullName.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || !form.bloodGroup) {
      setError('Enter a name, valid email, and blood group.');
      return;
    }
    if (!session) return;
    setPending(true);
    setError('');
    try {
      const { user: updated } = await api.updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        bloodGroup: form.bloodGroup,
        allergies: form.allergies,
        medicalConditions: form.medicalConditions,
        publicEmergencyConsent,
        vehicle: {
          type: form.vehicleType,
          registrationNumber: form.registrationNumber.trim().toUpperCase(),
          makeModel: form.makeModel.trim(),
          color: form.vehicleColor.trim(),
        },
      }, session.token);
      await updateUser(updated);
      setSaved('Profile updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save profile.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Surface>
        <Field label="Full name" value={form.fullName} onChangeText={(v) => set('fullName', v)} />
        <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone (cannot be changed)" value={user?.phone ?? ''} editable={false} />
        <OptionField label="Blood group" value={form.bloodGroup} options={bloodGroups} onValueChange={(v) => set('bloodGroup', v)} />
        <Field label="Allergies" value={form.allergies} onChangeText={(v) => set('allergies', v)} multiline />
        <Field label="Medical conditions" value={form.medicalConditions} onChangeText={(v) => set('medicalConditions', v)} multiline />
      </Surface>
      <Surface>
        <OptionField label="Vehicle type" value={form.vehicleType} options={vehicleTypes} onValueChange={(v) => set('vehicleType', v)} />
        <Field label="Registration number" value={form.registrationNumber} onChangeText={(v) => set('registrationNumber', v)} autoCapitalize="characters" />
        <Field label="Make and model" value={form.makeModel} onChangeText={(v) => set('makeModel', v)} />
        <Field label="Vehicle color" value={form.vehicleColor} onChangeText={(v) => set('vehicleColor', v)} />
      </Surface>
      <ConsentField value={publicEmergencyConsent} onValueChange={setPublicEmergencyConsent} />
      <StatusMessage message="Emergency contacts are managed separately." />
      {error ? <StatusMessage message={error} error /> : null}
      {saved ? <StatusMessage message={saved} /> : null}
      <ActionButton label="Save changes" onPress={submit} busy={pending} />
      <ActionButton label="Cancel" onPress={() => router.back()} secondary />
    </Page>
  );
}