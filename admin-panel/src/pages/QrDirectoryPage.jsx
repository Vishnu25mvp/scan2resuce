import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Download, ExternalLink, Printer, QrCode, RefreshCw, Search, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { apiRequest } from '../lib/api';
import './StickerPrint.css';

const cardUrl = (qrId) => `${window.location.origin}/emergency/${encodeURIComponent(qrId)}`;
const statusColors = {
  PENDING: 'badge-warning',
  PROCESSING: 'badge-info',
  DISPATCHED: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};
const stickerSizes = [
  { label: 'Small', millimeters: 55, qrPixels: 600 },
  { label: 'Standard', millimeters: 70, qrPixels: 720 },
  { label: 'Large', millimeters: 85, qrPixels: 900 },
];
const stickerColors = [
  { name: 'Rescue red', value: '#C93632' },
  { name: 'Signal blue', value: '#176B87' },
  { name: 'Safety green', value: '#267653' },
  { name: 'Amber', value: '#A65D13' },
];

function StickerPreview({ user, label, size, accent, showOwner, showRegistration }) {
  const qrSize = stickerSizes.find((option) => option.millimeters === size)?.qrPixels || 174;
  return (
    <article className="sticker-print-preview" style={{ '--sticker-accent': accent, '--sticker-size': `${size}mm` }}>
      <div className="sticker-brand-row">
        <div className="sticker-brand-mark"><ShieldIcon /></div>
        <div><strong>Scan2Rescue</strong><span>EMERGENCY CARD</span></div>
      </div>
      <div className="sticker-qr-frame">
        <QRCodeCanvas value={cardUrl(user.qrId)} size={qrSize} bgColor="#FFFFFF" fgColor="#111827" level="H" includeMargin />
      </div>
      <strong className="sticker-print-label">{label.trim() || 'Scan for emergency help'}</strong>
      {showOwner && <span className="sticker-private-detail">{user.fullName}</span>}
      {showRegistration && user.vehicle?.registrationNumber && <span className="sticker-private-detail">{user.vehicle.registrationNumber}</span>}
      <span className="sticker-footer">Scan to view emergency information</span>
    </article>
  );
}

function ShieldIcon() {
  return <QrCode size={17} aria-hidden="true" />;
}

export default function QrDirectoryPage({ token, apiHost }) {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [stickerUser, setStickerUser] = useState(null);
  const [stickerLabel, setStickerLabel] = useState('Scan for emergency help');
  const [stickerSize, setStickerSize] = useState(70);
  const [stickerAccent, setStickerAccent] = useState(stickerColors[0].value);
  const [showOwner, setShowOwner] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    setOrderError('');
    const [usersResult, ordersResult] = await Promise.allSettled([
      apiRequest('/api/admin/users', {}, token),
      apiRequest('/api/admin/sticker-orders', {}, token),
    ]);
    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value);
    } else {
      setError(usersResult.reason.message || 'Could not load registered users.');
    }
    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value.orders || []);
    } else {
      setOrderError(ordersResult.reason.message || 'Could not load sticker orders.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh, apiHost]);

  const latestOrderByQr = new Map();
  for (const order of orders) {
    if (!latestOrderByQr.has(order.qrId)) latestOrderByQr.set(order.qrId, order);
  }
  const usersWithQr = users.filter((user) => user.qrId);
  const filtered = usersWithQr.filter((user) => {
    const order = latestOrderByQr.get(user.qrId);
    return `${user.fullName} ${user.email} ${user.qrId} ${order?.status || ''}`.toLowerCase().includes(query.toLowerCase());
  });
  const download = (user) => {
    if (!user.publicEmergencyConsent) return;
    const canvas = document.getElementById(`qr-${user._id}`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${user.fullName.replaceAll(' ', '-')}-emergency-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>QR Directory</h2><p style={{ color: '#9ca3af', fontSize: 13 }}>All registered QR cards with their latest sticker-order status. {usersWithQr.length} QR codes · {orders.length} orders</p></div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 300 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#6b7280' }} /><input className="input-field" style={{ paddingLeft: 36 }} placeholder="Search users, QR IDs, or status" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <button className="btn btn-secondary" onClick={() => { void refresh(); }} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
    </div>
    {error && <div className="workflow-alert workflow-alert-error" role="alert">{error}</div>}
    {orderError && <div className="workflow-alert workflow-alert-error" role="alert">QR codes loaded, but order statuses are unavailable: {orderError}</div>}
    {loading ? <div className="glass-panel" style={{ padding: 40, color: '#9ca3af' }}>Loading QR directory...</div> : error ? null : filtered.length === 0 ? <div className="glass-panel" style={{ padding: 40, color: '#9ca3af', textAlign: 'center' }}>No registered QR codes match your search.</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18 }}>
      {filtered.map((user) => {
        const order = latestOrderByQr.get(user.qrId);
        return <article className="glass-panel" key={user._id} style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#ef4444', marginBottom: 14 }}><QrCode size={18} /><strong>Scan2Rescue</strong></div>
          {user.publicEmergencyConsent ? <QRCodeCanvas id={`qr-${user._id}`} value={cardUrl(user.qrId)} size={180} bgColor="#ffffff" fgColor="#111827" includeMargin /> : <div style={{ width: 180, height: 180, margin: '0 auto', display: 'grid', placeItems: 'center', padding: 18, border: '1px dashed rgba(255,255,255,.2)', color: '#9ca3af', fontSize: 13 }}>Owner has not enabled public sharing</div>}
          <h3 style={{ marginTop: 14 }}>{user.fullName}</h3><p style={{ color: '#9ca3af', fontSize: 12 }}>{user.bloodGroup || 'Blood group not listed'} · {user.qrId}</p>
          <div style={{ minHeight: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            {!user.publicEmergencyConsent ? <span className="badge badge-warning">Sharing disabled</span> : order ? <><span className={`badge ${statusColors[order.status] || 'badge-info'}`}><ClipboardList size={12} /> Sticker {order.status.toLowerCase()}</span><span style={{ color: '#9ca3af', fontSize: 11 }}>{order.placement} · {order.quantity} · {new Date(order.createdAt).toLocaleDateString()}</span>{order.trackingNumber && <span style={{ color: '#9ca3af', fontSize: 11 }}>Tracking: {order.trackingNumber}</span>}</> : <span className="badge badge-info">No sticker ordered</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>{user.publicEmergencyConsent ? <><button className="btn btn-primary" onClick={() => download(user)}><Download size={14} /> Download QR</button><a className="btn btn-secondary" href={cardUrl(user.qrId)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open card</a></> : <span style={{ color: '#9ca3af', fontSize: 12 }}>Owner must enable sharing in the mobile app.</span>}</div>
            {user.publicEmergencyConsent && <button className="btn btn-secondary sticker-open-button" onClick={() => { setStickerUser(user); setShowOwner(false); setShowRegistration(false); }}><Printer size={14} /> Customize &amp; print sticker</button>}
        </article>;
      })}
    </div>}
      {stickerUser && <div className="sticker-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setStickerUser(null); }}>
        <section className="sticker-editor" role="dialog" aria-modal="true" aria-labelledby="sticker-editor-title">
          <div className="sticker-editor-controls">
            <div className="sticker-editor-header"><div><span className="sticker-editor-eyebrow">PRINT DESIGN</span><h2 id="sticker-editor-title">Customize QR sticker</h2><p>{stickerUser.fullName} · {stickerUser.vehicle?.registrationNumber || stickerUser.qrId}</p></div><button type="button" className="sticker-close-button" onClick={() => setStickerUser(null)} aria-label="Close sticker editor"><X size={20} /></button></div>
            <label className="sticker-control-label" htmlFor="sticker-label">Printed instruction</label>
            <input id="sticker-label" className="input-field" maxLength={42} value={stickerLabel} onChange={(event) => setStickerLabel(event.target.value)} />
            <div className="sticker-control-group"><span className="sticker-control-label">Sticker size</span><div className="sticker-segmented">{stickerSizes.map((option) => <button type="button" key={option.millimeters} className={stickerSize === option.millimeters ? 'selected' : ''} onClick={() => setStickerSize(option.millimeters)}>{option.label}<small>{option.millimeters} mm</small></button>)}</div></div>
            <div className="sticker-control-group"><span className="sticker-control-label">Accent color</span><div className="sticker-swatches">{stickerColors.map((color) => <button type="button" key={color.value} className={stickerAccent === color.value ? 'selected' : ''} style={{ '--swatch-color': color.value }} aria-label={color.name} aria-pressed={stickerAccent === color.value} onClick={() => setStickerAccent(color.value)}><span /></button>)}</div></div>
            <label className="sticker-option"><input type="checkbox" checked={showOwner} onChange={(event) => setShowOwner(event.target.checked)} /> Print owner name</label>
            <label className="sticker-option"><input type="checkbox" checked={showRegistration} onChange={(event) => setShowRegistration(event.target.checked)} /> Print vehicle registration</label>
            <p className="sticker-privacy-note">Personal details are off by default. The QR itself opens the owner's consented emergency card.</p>
            <div className="sticker-editor-actions"><button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> Print sticker</button><button type="button" className="btn btn-secondary" onClick={() => setStickerUser(null)}>Close</button></div>
          </div>
          <div className="sticker-preview-area"><span className="sticker-preview-caption">PRINT PREVIEW · {stickerSize} × {stickerSize} MM</span><StickerPreview user={stickerUser} label={stickerLabel} size={stickerSize} accent={stickerAccent} showOwner={showOwner} showRegistration={showRegistration} /></div>
        </section>
      </div>}
  </div>;
}
