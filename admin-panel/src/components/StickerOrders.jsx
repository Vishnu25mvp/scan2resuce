import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import { apiRequest } from '../lib/api';
import './Workflow.css';

const statusColors = {
  PENDING: 'badge-warning',
  PROCESSING: 'badge-info',
  DISPATCHED: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function StickerOrders({ token, apiHost }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/admin/sticker-orders', {}, token);
      setOrders(data.orders || []);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh, apiHost]);

  async function updateStatus(order, status, details = {}) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = await apiRequest(`/api/admin/sticker-orders/${order._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...details }),
      }, token);
      setOrders((current) => current.map((item) => item._id === order._id ? data.order : item));
      setDispatchOrder(null);
      setNotice(`Order ${order._id.slice(-6)} updated to ${status.toLowerCase()}.`);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  function dispatch(order) {
    setTrackingNumber(order.trackingNumber || '');
    setDispatchNote(order.dispatchNote || '');
    setDispatchOrder(order);
  }

  const publicLink = (qrId) => `${window.location.origin}/emergency/${encodeURIComponent(qrId)}`;

  return <div className="workflow-page">
    <div className="workflow-page-heading"><div><h2>QR sticker orders</h2><p>Review requests, prepare stickers, and record dispatch details.</p></div><button type="button" className="btn btn-secondary" onClick={() => { void refresh(); }} disabled={loading}><RefreshCw size={15} /> Refresh</button></div>
    {error && <div className="workflow-alert workflow-alert-error" role="alert">{error}</div>}
    {notice && <div className="workflow-alert workflow-alert-success" role="status">{notice}</div>}
    <div className="glass-panel workflow-table-wrap">
      {loading ? <div className="workflow-empty">Loading sticker orders...</div> : orders.length === 0 ? <div className="workflow-empty">No sticker orders have been submitted.</div> : <div className="workflow-overflow">
        <table className="workflow-table"><thead><tr><th>Customer</th><th>Sticker</th><th>Deliver to</th><th>Placed</th><th>Status</th><th>Dispatch</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order._id}>
            <td><strong>{order.shippingAddress.recipientName}</strong><span>{order.user?.phone || order.shippingAddress.phone}</span><a href={publicLink(order.qrId)} target="_blank" rel="noreferrer">Open QR card <ExternalLink size={12} /></a></td>
            <td><strong>{order.placement}</strong><span>Quantity: {order.quantity}</span><span>QR: {order.qrId}</span></td>
            <td><strong>{order.shippingAddress.city}, {order.shippingAddress.state}</strong><span>{order.shippingAddress.addressLine1}</span><span>{order.shippingAddress.postalCode} · {order.shippingAddress.phone}</span></td>
            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            <td><span className={`badge ${statusColors[order.status] || 'badge-info'}`}>{order.status}</span>{order.trackingNumber && <span className="workflow-tracking">{order.trackingNumber}</span>}</td>
            <td><div className="workflow-row-actions">
              {order.status === 'PENDING' && <button className="btn btn-secondary" onClick={() => { void updateStatus(order, 'PROCESSING'); }} disabled={saving}><PackageCheck size={14} /> Process</button>}
              {order.status === 'PROCESSING' && <button className="btn btn-primary" onClick={() => dispatch(order)} disabled={saving}><Truck size={14} /> Dispatch</button>}
              {order.status === 'DISPATCHED' && <button className="btn btn-success" onClick={() => { void updateStatus(order, 'DELIVERED'); }} disabled={saving}>Mark delivered</button>}
              {['PENDING', 'PROCESSING'].includes(order.status) && <button className="btn btn-secondary" onClick={() => { if (window.confirm('Cancel this sticker order?')) void updateStatus(order, 'CANCELLED'); }} disabled={saving}>Cancel</button>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
    {dispatchOrder && <div className="workflow-overlay">
      <form className="glass-panel workflow-modal" onSubmit={(event) => { event.preventDefault(); void updateStatus(dispatchOrder, 'DISPATCHED', { trackingNumber, dispatchNote }); }}>
        <div className="workflow-modal-head"><div><span className="workflow-eyebrow">DISPATCH RECORD</span><h3>Dispatch sticker order</h3></div><button type="button" className="btn btn-secondary" onClick={() => setDispatchOrder(null)}>Close</button></div>
        <label className="workflow-field">Tracking number <input className="input-field" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Optional courier reference" /></label>
        <label className="workflow-field">Dispatch note <textarea className="input-field" value={dispatchNote} onChange={(event) => setDispatchNote(event.target.value)} placeholder="Courier and dispatch details" rows={3} /></label>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Confirm dispatch'}</button>
      </form>
    </div>}
  </div>;
}