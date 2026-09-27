import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Copy, Field, OptionField, Page, StatusMessage, Surface } from '@/components/rescue-ui';

const placements = ['', 'helmet', 'windshield', 'other'];
const vehicleTypes = ['', 'Motorcycle', 'Scooter', 'Car', 'Van', 'Other'];

export default function StickerOrderScreen() {
  const { session, updateUser } = useSession();
  const [form, setForm] = useState({
    placement: '', quantity: '1', vehicleType: session?.user.vehicle?.type ?? '',
    registrationNumber: session?.user.vehicle?.registrationNumber ?? '',
    recipientName: session?.user.fullName ?? '',
    phone: session?.user.phone ?? '', addressLine1: '', addressLine2: '', city: '',
    state: '', postalCode: '', country: 'India',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!session?.user.publicEmergencyConsent) {
      setError('Enable public emergency-card sharing in your profile before ordering a sticker.');
      return;
    }
    if (!session.user.qrId || !api.emergencyCardUrl(session.user.qrId)) {
      setError('The admin public-page URL is not configured in this app build.');
      return;
    }
    const quantity = Number(form.quantity);
    if (!form.placement || !form.vehicleType || !form.registrationNumber.trim() || !form.recipientName.trim() || !form.phone.trim() || !form.addressLine1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      setError('Complete the vehicle, sticker, and delivery details.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      setError('Quantity must be between 1 and 5.');
      return;
    }
    if (!session) return;
    setPending(true);
    setError('');
    try {
      const { user } = await api.updateProfile({
        vehicle: {
          type: form.vehicleType,
          registrationNumber: form.registrationNumber.trim().toUpperCase(),
          makeModel: session.user.vehicle?.makeModel ?? '',
          color: session.user.vehicle?.color ?? '',
        },
      }, session.token);
      await updateUser(user);
      await api.createStickerOrder({
        placement: form.placement as 'helmet' | 'windshield' | 'other',
        quantity,
        shippingAddress: {
          recipientName: form.recipientName.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'India',
        },
      }, session.token);
      router.replace('/(main)/sticker-orders');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit sticker order.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Page>
      <Copy muted>One order is reviewed by the Scan2Rescue team. Dispatch status and any tracking reference will appear in your order history.</Copy>
      {!session?.user.publicEmergencyConsent && <Surface>
        <Copy muted>Sticker scans open your public emergency card. Turn on sharing in your profile before ordering.</Copy>
        <ActionButton label="Review sharing settings" onPress={() => router.push('/(main)/profile-edit')} secondary />
      </Surface>}
      {session?.user.publicEmergencyConsent && session.user.qrId && !api.emergencyCardUrl(session.user.qrId) && <StatusMessage message="Sticker ordering is unavailable until the app is configured with the admin public-page URL." error />}
      <Surface>
        <OptionField label="Sticker placement" value={form.placement} options={placements} onValueChange={(value) => set('placement', value)} />
        <Field label="Quantity (1-5)" value={form.quantity} onChangeText={(value) => set('quantity', value)} keyboardType="number-pad" />
      </Surface>
      <Surface>
        <OptionField label="Vehicle type" value={form.vehicleType} options={vehicleTypes} onValueChange={(value) => set('vehicleType', value)} />
        <Field label="Vehicle registration number" value={form.registrationNumber} onChangeText={(value) => set('registrationNumber', value)} autoCapitalize="characters" />
      </Surface>
      <Surface>
        <Field label="Recipient name" value={form.recipientName} onChangeText={(value) => set('recipientName', value)} />
        <Field label="Delivery phone" value={form.phone} onChangeText={(value) => set('phone', value)} keyboardType="phone-pad" />
        <Field label="Address line 1" value={form.addressLine1} onChangeText={(value) => set('addressLine1', value)} />
        <Field label="Address line 2 (optional)" value={form.addressLine2} onChangeText={(value) => set('addressLine2', value)} />
        <Field label="City" value={form.city} onChangeText={(value) => set('city', value)} />
        <Field label="State" value={form.state} onChangeText={(value) => set('state', value)} />
        <Field label="Postal code" value={form.postalCode} onChangeText={(value) => set('postalCode', value)} keyboardType="number-pad" />
        <Field label="Country" value={form.country} onChangeText={(value) => set('country', value)} />
      </Surface>
      {error ? <StatusMessage message={error} error /> : null}
      <ActionButton label="Submit sticker order" onPress={submit} busy={pending} disabled={!session?.user.publicEmergencyConsent || !session.user.qrId || !api.emergencyCardUrl(session.user.qrId)} />
      <ActionButton label="Cancel" onPress={() => router.back()} secondary />
    </Page>
  );
}