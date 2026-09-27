import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/auth/session';
import { ActionButton, ConsentField, Copy, Field, OptionField, Page, StatusMessage, Surface, Title } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

const bloodGroups = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const vehicleTypes = ['', 'Motorcycle', 'Scooter', 'Car', 'Van', 'Other'];

export default function RegisterScreen() {
  const { signUp } = useSession();
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '', bloodGroup: '', allergies: '',
    medicalConditions: '', vehicleType: '', registrationNumber: '', makeModel: '',
    vehicleColor: '', publicEmergencyConsent: false, emergencyContactName: '', emergencyContactPhone: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    const digits = form.phone.replace(/\D/g, '');
    const emergencyDigits = form.emergencyContactPhone.replace(/\D/g, '');
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.password || !form.bloodGroup || !form.vehicleType || !form.registrationNumber.trim() || !form.emergencyContactName.trim() || !form.emergencyContactPhone.trim()) {
      setError('Complete all required personal, vehicle, and emergency-contact fields.');
      return;
    }
    if (digits.length < 7 || emergencyDigits.length < 7) {
      setError('Enter valid phone numbers.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await signUp({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.trim(),
        medicalConditions: form.medicalConditions.trim(),
        publicEmergencyConsent: form.publicEmergencyConsent,
        vehicle: {
          type: form.vehicleType,
          registrationNumber: form.registrationNumber.trim().toUpperCase(),
          makeModel: form.makeModel.trim(),
          color: form.vehicleColor.trim(),
        },
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      });
      router.replace('/(main)/home');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create account.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Link href="/(auth)/login" style={styles.back}>‹  Sign in</Link>
      <View style={styles.intro}>
        <Title>Create account</Title>
        <Copy muted>Your emergency profile helps responders act quickly.</Copy>
      </View>
      <Surface>
        <Field label="Full name" value={form.fullName} onChangeText={(v) => set('fullName', v)} />
        <Field label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
        <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password" value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry autoCapitalize="none" />
        <OptionField label="Blood group" value={form.bloodGroup} options={bloodGroups} onValueChange={(v) => set('bloodGroup', v)} />
        <Field label="Allergies (optional)" value={form.allergies} onChangeText={(v) => set('allergies', v)} multiline />
        <Field label="Medical conditions (optional)" value={form.medicalConditions} onChangeText={(v) => set('medicalConditions', v)} multiline />
      </Surface>
      <Surface>
        <Text style={styles.sectionTitle}>Vehicle details</Text>
        <OptionField label="Vehicle type" value={form.vehicleType} options={vehicleTypes} onValueChange={(v) => set('vehicleType', v)} />
        <Field label="Registration number" value={form.registrationNumber} onChangeText={(v) => set('registrationNumber', v)} autoCapitalize="characters" />
        <Field label="Make and model (optional)" value={form.makeModel} onChangeText={(v) => set('makeModel', v)} />
        <Field label="Color (optional)" value={form.vehicleColor} onChangeText={(v) => set('vehicleColor', v)} />
      </Surface>
      <ConsentField value={form.publicEmergencyConsent} onValueChange={(value) => set('publicEmergencyConsent', value)} />
      <Surface>
        <Text style={styles.sectionTitle}>Emergency contact</Text>
        <Field label="Contact name" value={form.emergencyContactName} onChangeText={(v) => set('emergencyContactName', v)} />
        <Field label="Contact phone" value={form.emergencyContactPhone} onChangeText={(v) => set('emergencyContactPhone', v)} keyboardType="phone-pad" />
      </Surface>
      {error ? <StatusMessage message={error} error /> : null}
      <ActionButton label="Create account" onPress={submit} busy={pending} />
    </Page>
  );
}

const styles = StyleSheet.create({
  back: { color: C.muted, fontSize: 15, fontWeight: '600' },
  intro: { gap: 6, paddingVertical: 4 },
  sectionTitle: { color: C.primary, fontSize: 16, fontWeight: '700' },
});