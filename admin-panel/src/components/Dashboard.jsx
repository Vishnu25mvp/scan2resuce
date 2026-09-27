import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ShieldAlert, Users, Calendar, CheckCircle2, MapPin, Phone, Heart, ShieldAlert as AlertIcon, Map, ExternalLink } from 'lucide-react';

function Dashboard({ alerts, stats, token, apiHost, onResolve }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  // Fetch hospitals to show on map
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch(`${apiHost}/api/hospitals/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHospitals(data);
        }
      } catch (err) {
        console.error('Error fetching hospitals for map:', err);
      }
    };
    fetchHospitals();
  }, [token, apiHost]);

  // Active alerts filter
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const recentAlerts = alerts.slice(0, 15); // Show top 15 in table

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Default center: Coimbatore, Tamil Nadu (based on hospital seeds)
    let centerLat = 11.018;
    let centerLng = 76.97;
    let zoomLevel = 13;

    // Center on the first active alert if available
    if (activeAlerts.length > 0 && activeAlerts[0].latitude !== undefined) {
      centerLat = activeAlerts[0].latitude;
      centerLng = activeAlerts[0].longitude;
      zoomLevel = 14;
    }

    // Initialize Map if not already created
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
        zoomControl: true,
      });

      // Add dark-themed CartoDB map tiles (looks very premium!)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);

      // Create a layer group for markers
      markersGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    } else {
      // If map is already initialized, pan to center
      mapInstance.current.setView([centerLat, centerLng], zoomLevel);
    }

    // Clear previous markers
    markersGroupRef.current.clearLayers();

    // 1. Draw Hospital Markers
    hospitals.forEach((hosp) => {
      if (hosp.latitude === undefined || hosp.longitude === undefined) return;

      const hospitalMarkup = `
        <div style="font-family: sans-serif; min-width: 150px; color: #fff;">
          <h4 style="margin: 0 0 6px 0; color: #10b981; font-size: 13px; font-weight: 700;">🏥 ${hosp.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #e5e7eb;">${hosp.address || 'Address not listed'}</p>
          <a href="tel:${hosp.phone}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #3b82f6; text-decoration: none; font-weight: 600;">
            📞 ${hosp.phone}
          </a>
        </div>
      `;

      // Custom blue-green marker for hospitals
      const hospitalIcon = L.divIcon({
        html: `<div style="background: #10b981; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);"></div>`,
        className: 'custom-hosp-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker([hosp.latitude, hosp.longitude], { icon: hospitalIcon })
        .bindPopup(hospitalMarkup)
        .addTo(markersGroupRef.current);
    });

    // 2. Draw Active Emergency Markers
    activeAlerts.forEach((alert) => {
      if (alert.latitude === undefined || alert.longitude === undefined) return;

      const victimName = alert.user?.fullName || 'Anonymous';
      const alertTime = new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const bloodGroup = alert.user?.bloodGroup || 'Unknown';
      const phone = alert.user?.phone || 'No phone';

      const alertMarkup = `
        <div style="font-family: sans-serif; min-width: 180px; color: #fff; padding: 4px 0;">
          <h4 style="margin: 0 0 6px 0; color: #ef4444; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            🚨 EMERGENCY ALERT
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600;">Victim: ${victimName}</p>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #d1d5db;">Blood Group: <span style="color: #f87171; font-weight: 700;">${bloodGroup}</span></p>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #d1d5db;">Triggered: ${alertTime}</p>
          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <a href="tel:${phone}" style="font-size: 11px; color: #3b82f6; text-decoration: none; font-weight: 600;">📞 Call</a>
            <a href="https://maps.google.com/?q=${alert.latitude},${alert.longitude}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #3b82f6; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">
              📍 Maps ↗
            </a>
          </div>
        </div>
      `;

      // Custom pulsing red icon
      const pulseIcon = L.divIcon({
        className: 'leaflet-pulse-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([alert.latitude, alert.longitude], { icon: pulseIcon })
        .bindPopup(alertMarkup)
        .addTo(markersGroupRef.current);
    });

    // Cleanup on component unmount
    return () => {
      // We don't remove map here to keep instances persistent during quick tab changes,
      // but we can clean up if desired. For stability, let's keep it.
    };
  }, [activeAlerts, hospitals]);

  // Clean up map instance when component completely unmounts
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleFocusAlert = (alert) => {
    setSelectedAlert(alert);
    if (mapInstance.current && alert.latitude !== undefined && alert.longitude !== undefined) {
      mapInstance.current.setView([alert.latitude, alert.longitude], 15);
      // Trigger a popup programmatically
      L.popup()
        .setLatLng([alert.latitude, alert.longitude])
        .setContent(`
          <div style="font-family: sans-serif; color: #fff; min-width: 150px;">
            <h4 style="margin:0 0 4px 0; color: #ef4444;">🚨 Victim Location</h4>
            <p style="margin:0; font-size: 12px; font-weight:600;">${alert.user?.fullName || 'Anonymous'}</p>
          </div>
        `)
        .openOn(mapInstance.current);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Registered Victims</span>
            <span style={{ fontSize: '28px', fontWeight: '800' }}>{stats.totalUsers}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel emergency-glow" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <ShieldAlert size={28} className={stats.activeAlerts > 0 ? "blink" : ""} style={stats.activeAlerts > 0 ? { animation: 'blink 1s infinite' } : {}} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Active Emergencies</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: stats.activeAlerts > 0 ? '#ef4444' : 'inherit' }}>{stats.activeAlerts}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Calendar size={28} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Alerts Today</span>
            <span style={{ fontSize: '28px', fontWeight: '800' }}>{stats.alertsToday}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Resolved Cases</span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{stats.resolvedAlerts}</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Interactive Map + Active Dispatch Control */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '24px',
        minHeight: '480px'
      }}>
        {/* Map Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={18} color="#ef4444" />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Emergency Dispatch Live Map</h3>
            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>
              🟢 Green Dots: Hospitals | 🔴 Red Pulsing: Emergency Location
            </span>
          </div>
          {/* Map div container */}
          <div ref={mapRef} style={{ flex: 1, minHeight: '400px', background: '#111827', zIndex: 1 }} />
        </div>

        {/* Dispatch Controls / Active Alerts List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertIcon size={18} color="#ef4444" />
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Active Dispatches</h3>
            </div>
            <span className="badge badge-danger">{activeAlerts.length} Active</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeAlerts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', textAlign: 'center', gap: '10px' }}>
                <CheckCircle2 size={42} color="#10b981" />
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#f3f4f6' }}>All Clear</p>
                  <p style={{ fontSize: '13px' }}>No active emergency dispatches currently.</p>
                </div>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="glass-panel"
                  onClick={() => handleFocusAlert(alert)}
                  style={{
                    padding: '16px',
                    borderColor: selectedAlert?._id === alert._id ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                    background: selectedAlert?._id === alert._id ? 'rgba(239, 68, 68, 0.05)' : 'rgba(17, 24, 39, 0.9)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                        {alert.user?.fullName || 'Anonymous User'}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        Type: {alert.type === 'state_helpline' ? `State helpline · ${alert.emergencyNumber || '112'}` : alert.type === 'call' ? 'Direct Call Logger' : 'SMS GPS Alert'}
                      </span>
                    </div>
                    <span className="badge badge-danger" style={{ animation: 'blink 1.2s infinite' }}>ACTIVE</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#d1d5db', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Heart size={14} color="#ef4444" />
                      <span>Blood Group: <strong>{alert.user?.bloodGroup || 'Not Provided'}</strong></span>
                    </div>
                    {alert.user?.allergies && (
                      <div style={{ fontSize: '12px', color: '#fbbf24' }}>
                        ⚠️ <strong>Allergies:</strong> {alert.user.allergies}
                      </div>
                    )}
                    {alert.user?.medicalConditions && (
                      <div style={{ fontSize: '12px', color: '#f87171' }}>
                        🩺 <strong>Conditions:</strong> {alert.user.medicalConditions}
                      </div>
                    )}
                    {alert.type === 'state_helpline' && (
                      <div style={{ fontSize: '12px', color: '#fbbf24' }}>
                        <strong>Emergency line:</strong> {alert.emergencyNumber} · {alert.emergencyRegion || 'Region unavailable'} · {alert.callerMode || 'owner'}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#9ca3af" />
                      <a href={`tel:${alert.user?.phone}`} onClick={(e) => e.stopPropagation()} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {alert.user?.phone}
                      </a>
                    </div>
                    {alert.latitude !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#ef4444" />
                        <span style={{ fontSize: '12px' }}>Coordinates: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(alert._id);
                      }}
                      className="btn btn-success"
                      style={{ flex: 1, padding: '8px' }}
                    >
                      Resolve Emergency
                    </button>
                    {alert.latitude !== undefined && (
                      <a
                        href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. History Logs */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Recent Alert History logs</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Emergency User</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Event</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Phone</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Blood Group</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Triggered Time</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Location</th>
                <th style={{ padding: '14px 20px', color: '#9ca3af', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                    No alerts logged in the system.
                  </td>
                </tr>
              ) : (
                recentAlerts.map((alert) => (
                  <tr
                    key={alert._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: alert.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                      {alert.user?.fullName || 'Anonymous'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {alert.type === 'state_helpline' ? <><span className="badge badge-warning">Called {alert.emergencyNumber}</span><small style={{ display: 'block', marginTop: 5, color: '#9ca3af' }}>{alert.emergencyRegion || 'Region unavailable'} · {alert.callerMode || 'owner'}</small></> : alert.type === 'call' ? 'Contact call' : 'Location SMS'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>{alert.user?.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        {alert.user?.bloodGroup || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {alert.latitude !== undefined ? (
                        <a
                          href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MapPin size={13} />
                          <span>Show Maps</span>
                        </a>
                      ) : (
                        <span style={{ color: '#6b7280' }}>No GPS Data</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${alert.status === 'ACTIVE' ? 'badge-danger' : 'badge-success'}`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
