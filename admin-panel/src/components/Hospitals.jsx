import React, { useState, useEffect } from 'react';
import { Hospital, Phone, Plus, Map, RefreshCw, AlertCircle, Pencil, Trash2 } from 'lucide-react';

function Hospitals({ token, apiHost }) {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, [token, apiHost]);

  const fetchHospitals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiHost}/api/hospitals/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !latitude || !longitude) {
      setFormError('Please fill in all required fields (Name, Phone, Coordinates).');
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setFormError('Coordinates must be valid numbers.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(
        editingHospital
          ? `${apiHost}/api/hospitals/${editingHospital._id}`
          : `${apiHost}/api/hospitals/add`,
        {
        method: editingHospital ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          latitude: latNum,
          longitude: lngNum
        })
        }
      );

      if (response.ok) {
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
        setLatitude('');
        setLongitude('');
        setEditingHospital(null);
        setShowAddForm(false);
        // Refresh list
        fetchHospitals();
      } else {
        const data = await response.json();
        setFormError(data.message || 'Error adding hospital.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error. Failed to add hospital.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (hospital) => {
    setEditingHospital(hospital);
    setName(hospital.name);
    setPhone(hospital.phone);
    setAddress(hospital.address || '');
    setLatitude(String(hospital.latitude));
    setLongitude(String(hospital.longitude));
    setFormError('');
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setEditingHospital(null);
    setName('');
    setPhone('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setFormError('');
    setShowAddForm(false);
  };

  const deleteHospital = async (hospital) => {
    if (!window.confirm(`Delete ${hospital.name}?`)) return;

    try {
      const response = await fetch(`${apiHost}/api/hospitals/${hospital._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete hospital');
      }

      setHospitals((current) => current.filter((item) => item._id !== hospital._id));
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Emergency Hospitals Registry</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Configure and view medical assets mapped for emergency routing.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>{showAddForm ? 'View Registry List' : 'Add New Hospital'}</span>
        </button>
      </div>

      {/* Conditional rendering of form vs table list */}
      {showAddForm ? (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            <Hospital size={20} color="#10b981" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
              {editingHospital ? 'Edit Hospital Asset' : 'Register Hospital Asset'}
            </h3>
          </div>

          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>
                Hospital Name *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Kovai Medical Center"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>
                Emergency Phone Number *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. +914224323800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>
                Address Details
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Avinashi Road, Coimbatore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Coordinates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>
                  GPS Latitude *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 11.04196"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase' }}>
                  GPS Longitude *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 77.04044"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="spin" size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                    <span>Registering...</span>
                  </>
                ) : (
                    <span>{editingHospital ? 'Save Hospital' : 'Register Hospital'}</span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSubmitting}
                onClick={cancelForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Hospital table list */
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
              Loading hospital directory...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Hospital Name</th>
                    <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Emergency Phone</th>
                    <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Full Address</th>
                    <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>GPS Coordinates</th>
                    <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        No emergency hospitals registered in database.
                      </td>
                    </tr>
                  ) : (
                    hospitals.map((hosp) => (
                      <tr
                        key={hosp._id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                      >
                        <td style={{ padding: '14px 20px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🏥</span>
                          <span>{hosp.name}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <a href={`tel:${hosp.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} />
                            <span>{hosp.phone}</span>
                          </a>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#9ca3af', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hosp.address || 'Address not listed'}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#9ca3af', fontFamily: 'monospace' }}>
                          {hosp.latitude.toFixed(5)}, {hosp.longitude.toFixed(5)}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <a
                            href={`https://maps.google.com/?q=${hosp.latitude},${hosp.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Map size={12} />
                            <span>Locate Map</span>
                          </a>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => startEditing(hosp)}
                            title={`Edit ${hosp.name}`}
                            style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => deleteHospital(hosp)}
                            title={`Delete ${hosp.name}`}
                            style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center', color: '#f87171' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Hospitals;
