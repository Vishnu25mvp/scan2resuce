import React, { useEffect, useState } from 'react';
import { KeyRound, Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react';

export default function AdminManagement({ token, apiHost, currentAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ username: '', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const response = await fetch(`${apiHost}/api/admin/admins`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load admins');
    setAdmins(data);
  };
  useEffect(() => { load().catch((loadError) => setError(loadError.message)); }, [token, apiHost]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const response = await fetch(`${apiHost}/api/admin/admins${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) return setError(data?.message || 'Could not save admin');
    setForm({ username: '', password: '' }); setEditingId(null); load();
  };

  const remove = async (admin) => {
    if (!window.confirm(`Delete admin ${admin.username}?`)) return;
    const response = await fetch(`${apiHost}/api/admin/admins/${admin._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) setError((await response.json()).message || 'Could not delete admin'); else load();
  };

  const toggle = async (admin) => {
    const response = await fetch(`${apiHost}/api/admin/admins/${admin._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !admin.active }) });
    if (response.ok) load(); else setError((await response.json()).message || 'Could not update admin');
  };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>Admin Management</h2><p style={{ color: '#9ca3af', fontSize: 13 }}>Create, edit, disable, and remove dashboard administrators.</p></div>
    <div className="glass-panel" style={{ padding: 20 }}><form onSubmit={submit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <input className="input-field" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
      <input className="input-field" type="password" placeholder={editingId ? 'New password (optional)' : 'Password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingId} />
      <button className="btn btn-primary" type="submit"><UserPlus size={15} /> {editingId ? 'Save Admin' : 'Create Admin'}</button>
      {editingId && <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setForm({ username: '', password: '' }); }}>Cancel</button>}
    </form>{error && <p style={{ color: '#f87171' }}>{error}</p>}</div>
    <div className="glass-panel" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th style={{ padding: 14 }}>Username</th><th style={{ padding: 14 }}>Role</th><th style={{ padding: 14 }}>Status</th><th style={{ padding: 14, textAlign: 'right' }}>Actions</th></tr></thead><tbody>{admins.map((admin) => <tr key={admin._id} style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}><td style={{ padding: 14 }}><KeyRound size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />{admin.username}{admin.username === currentAdmin?.username && <small style={{ color: '#60a5fa', marginLeft: 8 }}>(you)</small>}</td><td style={{ padding: 14 }}>{admin.role}</td><td style={{ padding: 14 }}><span className={`badge ${admin.active ? 'badge-success' : 'badge-danger'}`}>{admin.active ? 'Active' : 'Disabled'}</span></td><td style={{ padding: 14, textAlign: 'right' }}><button className="btn btn-secondary" onClick={() => { setEditingId(admin._id); setForm({ username: admin.username, password: '' }); }}><Pencil size={14} /></button><button className="btn btn-secondary" onClick={() => toggle(admin)} style={{ marginLeft: 8 }}><ShieldCheck size={14} /> {admin.active ? 'Disable' : 'Enable'}</button><button className="btn btn-secondary" onClick={() => remove(admin)} style={{ marginLeft: 8, color: '#f87171' }}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>
  </div>;
}
