import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { api, type StickerOrder } from '@/api/client';
import { useSession } from '@/auth/session';
import { ActionButton, Copy, Page, StatusMessage, Surface } from '@/components/rescue-ui';
import { RescueColors as C } from '@/constants/rescue-theme';

const statusColor: Record<StickerOrder['status'], string> = {
  PENDING: '#F0B84C',
  PROCESSING: '#76A9FA',
  DISPATCHED: '#76A9FA',
  DELIVERED: '#46A878',
  CANCELLED: '#F06A64',
};

export default function StickerOrdersScreen() {
  const { session } = useSession();
  const [orders, setOrders] = useState<StickerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = session?.token;

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.getMyStickerOrders(token);
      setOrders(result.orders || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load sticker orders.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void loadOrders(); }, [loadOrders]));

  return (
    <Page>
      <View style={{ gap: 6 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '700' }}>Sticker orders</Text>
        <Copy muted>Follow each request from review to delivery.</Copy>
      </View>
      {loading ? <StatusMessage message="Loading your orders..." /> : null}
      {error ? <StatusMessage message={error} error /> : null}
      {!loading && !error && orders.length === 0 ? <Surface><Copy muted>You have not ordered a QR sticker yet.</Copy></Surface> : null}
      {orders.map((order) => <Surface key={order._id}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{order.placement} sticker × {order.quantity}</Text>
          <Text style={{ color: statusColor[order.status], fontSize: 12, fontWeight: '800' }}>{order.status}</Text>
        </View>
        <Copy muted>{order.shippingAddress.city}, {order.shippingAddress.state} · {new Date(order.createdAt).toLocaleDateString()}</Copy>
        {order.trackingNumber ? <Copy>Tracking: {order.trackingNumber}</Copy> : null}
        {order.dispatchNote ? <Copy muted>{order.dispatchNote}</Copy> : null}
      </Surface>)}
      {error ? <ActionButton label="Retry" onPress={() => { void loadOrders(); }} secondary /> : null}
      <ActionButton label="Order a QR sticker" onPress={() => router.push('/(main)/sticker-order')} />
    </Page>
  );
}