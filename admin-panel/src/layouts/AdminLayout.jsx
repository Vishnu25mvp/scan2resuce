import React, { useEffect, useState } from 'react';
import { Ambulance, BellRing, ClipboardList, Hospital as HospitalIcon, LayoutDashboard, LogOut, QrCode, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Registered Users', icon: UsersIcon },
  { path: '/hospitals', label: 'Hospitals', icon: HospitalIcon },
  { path: '/ambulances', label: 'Ambulances', icon: Ambulance },
  { path: '/sticker-orders', label: 'Sticker Orders', icon: ClipboardList },
  { path: '/admins', label: 'Admin Management', icon: ShieldCheck },
  { path: '/qr-directory', label: 'QR Directory', icon: QrCode },
];

export default function AdminLayout() {
  const { token, admin, logout, apiUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalAlerts: 0, activeAlerts: 0, resolvedAlerts: 0, alertsToday: 0, pendingStickerOrders: 0 });
  const [notification, setNotification] = useState(null);

  const refresh = async () => {
    const [nextStats, nextAlerts] = await Promise.all([
      apiRequest('/api/admin/stats', {}, token),
      apiRequest('/api/admin/alerts', {}, token),
    ]);
    setStats(nextStats);
    setAlerts(nextAlerts);
  };

  useEffect(() => {
    refresh().catch(console.error);
    const socket = io(apiUrl);
    socket.on('new_alert', (alert) => {
      setAlerts((current) => [alert, ...current]);
      setNotification({ message: `Emergency alert from ${alert.user?.fullName || 'Unknown user'}`, user: alert.user });
    });
    socket.on('alert_updated', refresh);
    socket.on('new_sticker_order', refresh);
    return () => socket.disconnect();
  }, [token, apiUrl]);

  const resolveAlert = async (alertId) => {
    await apiRequest(`/api/admin/alerts/${alertId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'RESOLVED' }) }, token);
    refresh();
  };

  return <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
    <aside style={{ width: 260, background: '#111827', borderRight: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 8px' }}><div style={{ background: '#ef4444', padding: 8, borderRadius: 8 }}><QrCode size={22} color="white" /></div><div><h1 style={{ fontSize: 18 }}>Scan2Rescue</h1><span style={{ fontSize: 11, color: '#9ca3af' }}>ADMIN CONSOLE</span></div></div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>{navItems.map(({ path, label, icon: Icon }) => { const active = location.pathname === path; const badge = path === '/' ? stats.activeAlerts : path === '/sticker-orders' ? stats.pendingStickerOrders : 0; return <button key={path} className="btn" onClick={() => navigate(path)} style={{ justifyContent: 'flex-start', gap: 10, border: 0, padding: '12px 16px', background: active ? 'rgba(239,68,68,.12)' : 'transparent', color: active ? '#ef4444' : '#9ca3af' }}><Icon size={18} /><span>{label}</span>{badge > 0 && <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{badge}</span>}</button>; })}</nav>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20 }}><div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}><div className="avatar">{admin?.username?.charAt(0).toUpperCase()}</div><div><strong>@{admin?.username}</strong><small style={{ display: 'block', color: '#6b7280' }}>Administrator</small></div></div><button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}><LogOut size={15} /> Sign Out</button></div>
    </aside>
    <main style={{ flex: 1, background: '#0a0e17', overflowY: 'auto' }}><header style={{ height: 70, padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}><span>{stats.activeAlerts ? `${stats.activeAlerts} ACTIVE EMERGENCIES` : 'ALL SYSTEMS OPERATIONAL'}</span><span style={{ color: '#9ca3af', display: 'flex', gap: 7, alignItems: 'center' }}><BellRing size={15} /> Live sync</span></header><div style={{ padding: 32 }}><Outlet context={{ alerts, stats, token, apiHost: apiUrl, onResolve: resolveAlert, refresh }} /></div></main>
    {notification && <div className="glass-panel" style={{ position: 'fixed', right: 24, bottom: 24, width: 340, padding: 18, zIndex: 5 }}><strong style={{ color: '#ef4444' }}>CRITICAL ALERT</strong><p>{notification.message}</p><button className="btn btn-secondary" onClick={() => setNotification(null)}>Dismiss</button></div>}
  </div>;
}
