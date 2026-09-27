import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, Heart, AlertTriangle, ShieldCheck, X, Contact, Pencil, Trash2 } from 'lucide-react';

function Users({ token, apiHost }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [token, apiHost]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiHost}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const editUser = async (user) => {
    const fullName = window.prompt('Full name', user.fullName);
    if (fullName === null) return;
    const bloodGroup = window.prompt('Blood group', user.bloodGroup);
    if (bloodGroup === null) return;
    const allergies = window.prompt('Allergies', user.allergies || '');
    if (allergies === null) return;
    const medicalConditions = window.prompt('Medical conditions', user.medicalConditions || '');
    if (medicalConditions === null) return;

    try {
      const response = await fetch(`${apiHost}/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, bloodGroup, allergies, medicalConditions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update user');

      setUsers((current) => current.map((item) => (
        item._id === user._id ? { ...item, ...data.user } : item
      )));
      setSelectedUser((current) => current?._id === user._id ? { ...current, ...data.user } : current);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.fullName} and all related emergency data?`)) return;

    try {
      const response = await fetch(`${apiHost}/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not delete user');
      }
      setUsers((current) => current.filter((item) => item._id !== user._id));
      setSelectedUser(null);
    } catch (error) {
      window.alert(error.message);
    }
  };

  // Filter users based on query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      (user.phone && user.phone.includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.bloodGroup && user.bloodGroup.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Emergency Profile Users</h2>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Manage and inspect medical profiles registered on Scan2Rescue.</p>
        </div>

        {/* Search input bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, blood, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Users List Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Loading database records...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Phone</th>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Email Address</th>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Blood Group</th>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Emergency Contacts</th>
                  <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      No registered users match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s'
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#fff' }}>
                        {user.fullName}
                      </td>
                      <td style={{ padding: '14px 20px' }}>{user.phone}</td>
                      <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{user.email}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-danger" style={{ fontWeight: '700' }}>
                          {user.bloodGroup}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#9ca3af' }}>
                        {user.contacts && user.contacts.length > 0 ? (
                          <span>
                            {user.contacts[0].name} ({user.contacts[0].relation})
                            {user.contacts.length > 1 && ` +${user.contacts.length - 1} more`}
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>None Listed</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          View Emergency Card
                        </button>
                        <button
                          onClick={() => editUser(user)}
                          className="btn btn-secondary"
                          title={`Edit ${user.fullName}`}
                          style={{ padding: '6px 9px', marginLeft: '6px' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="btn btn-secondary"
                          title={`Delete ${user.fullName}`}
                          style={{ padding: '6px 9px', marginLeft: '6px', color: '#f87171' }}
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

      {/* Emergency Card Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '560px',
            background: '#111827',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Emergency Profile</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '75vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Primary Info Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{selectedUser.fullName}</h4>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>QR-ID: {selectedUser.qrId}</span>
                </div>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <span style={{ display: 'block', fontSize: '9px', color: '#ef4444', fontWeight: '600', textTransform: 'uppercase' }}>Blood Group</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{selectedUser.bloodGroup}</span>
                </div>
              </div>

              {/* Grid Contact info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Phone size={14} color="#9ca3af" />
                    <span>{selectedUser.phone}</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Mail size={14} color="#9ca3af" />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedUser.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px', border: '1px solid rgba(255,255,255,.08)', borderRadius: '6px' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Public emergency card sharing</span>
                <span className={`badge ${selectedUser.publicEmergencyConsent ? 'badge-success' : 'badge-warning'}`}>
                  {selectedUser.publicEmergencyConsent ? 'Owner consented' : 'Disabled by owner'}
                </span>
              </div>

              {/* Vehicle details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>Vehicle Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Registration</label><span>{selectedUser.vehicle?.registrationNumber || 'Not listed'}</span></div>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Vehicle</label><span>{[selectedUser.vehicle?.type, selectedUser.vehicle?.makeModel].filter(Boolean).join(' · ') || 'Not listed'}</span></div>
                  <div><label style={{ display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Color</label><span>{selectedUser.vehicle?.color || 'Not listed'}</span></div>
                </div>
              </div>

              {/* Medical Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>Medical Annotations</h4>
                
                {/* Allergies */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>
                    <AlertTriangle size={14} />
                    <span>Allergies</span>
                  </div>
                  <p style={{ fontSize: '13px', color: selectedUser.allergies ? '#f3f4f6' : '#9ca3af' }}>
                    {selectedUser.allergies || 'No allergies declared.'}
                  </p>
                </div>

                {/* Medical Conditions */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
                    <Heart size={14} />
                    <span>Chronic Medical Conditions</span>
                  </div>
                  <p style={{ fontSize: '13px', color: selectedUser.medicalConditions ? '#f3f4f6' : '#9ca3af' }}>
                    {selectedUser.medicalConditions || 'No existing conditions declared.'}
                  </p>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>Emergency Contacts</h4>
                
                {selectedUser.contacts && selectedUser.contacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedUser.contacts.map((contact, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
                            <Contact size={14} color="#3b82f6" />
                            <span>{contact.name}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Relationship: {contact.relation}</span>
                        </div>
                        <a
                          href={`tel:${contact.phone}`}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Phone size={12} />
                          <span>Call Contact</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '10px' }}>No emergency contacts registered.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-primary"
                style={{ background: '#374151', color: '#fff' }}
              >
                Close Profile
              </button>
              <button
                onClick={() => editUser(selectedUser)}
                className="btn btn-secondary"
                style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Pencil size={14} />
                Edit User
              </button>
              <button
                onClick={() => deleteUser(selectedUser)}
                className="btn btn-secondary"
                style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f87171' }}
              >
                <Trash2 size={14} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
}

export default Users;
