import { useCallback, useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import './Workflow.css';

const emptyForm = { name: '', provider: '', phone: '', address: '', latitude: '', longitude: '', available: true };

export default function Ambulances({ token, apiHost }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await apiRequest('/api/ambulances/admin/all', {}, token));
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh, apiHost]);

  function beginEdit(item) {
    setEditing(item);
    setForm({ ...item, latitude: String(item.latitude), longitude: String(item.longitude) });
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const body = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) };
    try {
      await apiRequest(editing ? `/api/ambulances/${editing._id}` : '/api/ambulances', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }, token);
      closeForm();
      await refresh();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove ${item.name} from the ambulance directory?`)) return;
    try {
      await apiRequest(`/api/ambulances/${item._id}`, { method: 'DELETE' }, token);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
    } catch (cause) {
      setError(cause.message);
    }
  }

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return <div className="workflow-page">
    <div className="workflow-page-heading"><div><h2>Ambulance directory</h2><p>Keep available emergency transport and contact coordinates current.</p></div><div className="workflow-row-actions"><button className="btn btn-secondary" onClick={() => { void refresh(); }} disabled={loading}><RefreshCw size={15} /> Refresh</button><button className="btn btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}><Plus size={15} /> Add ambulance</button></div></div>
    {error && <div className="workflow-alert workflow-alert-error" role="alert">{error}</div>}
    {showForm && <form className="glass-panel workflow-form" onSubmit={submit}>
      <div className="workflow-modal-head"><div><span className="workflow-eyebrow">SERVICE DETAILS</span><h3>{editing ? 'Edit ambulance' : 'Add ambulance'}</h3></div><button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button></div>
      <div className="ambulance-form-grid">
        <label className="workflow-field">Service name *<input className="input-field" required value={form.name} onChange={(event) => change('name', event.target.value)} /></label>
        <label className="workflow-field">Provider<input className="input-field" value={form.provider} onChange={(event) => change('provider', event.target.value)} /></label>
        <label className="workflow-field">Phone *<input className="input-field" type="tel" required value={form.phone} onChange={(event) => change('phone', event.target.value)} /></label>
        <label className="workflow-field">Availability<select className="input-field" value={String(form.available)} onChange={(event) => change('available', event.target.value === 'true')}><option value="true">Available</option><option value="false">Unavailable</option></select></label>
        <label className="workflow-field ambulance-address">Address<input className="input-field" value={form.address} onChange={(event) => change('address', event.target.value)} /></label>
        <label className="workflow-field">Latitude *<input className="input-field" type="number" step="any" required value={form.latitude} onChange={(event) => change('latitude', event.target.value)} /></label>
        <label className="workflow-field">Longitude *<input className="input-field" type="number" step="any" required value={form.longitude} onChange={(event) => change('longitude', event.target.value)} /></label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save ambulance' : 'Add ambulance'}</button>
    </form>}
    <div className="glass-panel workflow-table-wrap">
      {loading ? <div className="workflow-empty">Loading ambulance directory...</div> : items.length === 0 ? <div className="workflow-empty">No ambulances are registered yet.</div> : <div className="workflow-overflow"><table className="workflow-table"><thead><tr><th>Service</th><th>Phone</th><th>Address</th><th>Coordinates</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><span>{item.provider || 'Independent service'}</span></td><td><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.address || 'Not listed'}</td><td><a href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer"><MapPin size={13} /> {item.latitude}, {item.longitude}</a></td><td><span className={`badge ${item.available ? 'badge-success' : 'badge-warning'}`}>{item.available ? 'Available' : 'Unavailable'}</span></td><td><div className="workflow-row-actions"><button className="btn btn-secondary" title="Edit ambulance" onClick={() => beginEdit(item)}><Pencil size={14} /></button><button className="btn btn-secondary" title="Delete ambulance" onClick={() => { void remove(item); }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}