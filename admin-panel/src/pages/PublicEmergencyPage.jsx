import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ambulance, HeartPulse, MapPin, Phone, ShieldAlert } from 'lucide-react';
import './PublicEmergencyPage.css';

async function fetchJson(url, signal) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Could not load emergency information.');
  return data;
}

function ResourceList({ title, icon: Icon, items, emptyMessage, locationLabel }) {
  return <section className="public-section">
    <div className="public-section-heading"><Icon size={19} /><h2>{title}</h2></div>
    {items.length === 0 ? <p className="public-muted">{emptyMessage}</p> : <div className="public-resources">
      {items.map((item) => <article className="public-resource" key={item._id || `${item.name}-${item.phone}`}>
        <div><strong>{item.name}</strong>{item.provider && <p className="public-muted">{item.provider}</p>}<p className="public-muted">{item.address || 'Address not listed'}{Number.isFinite(item.distanceKm) ? ` · ${item.distanceKm} km` : ''}</p></div>
        <div className="public-resource-actions"><a className="public-call" href={`tel:${item.phone}`} aria-label={`Call ${item.name}`}><Phone size={16} /> Call</a>{Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && <a href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer" aria-label={`Directions to ${item.name}`}><MapPin size={16} /> Map</a>}</div>
      </article>)}
    </div>}
    {locationLabel && <p className="public-location-note">{locationLabel}</p>}
  </section>;
}

export default function PublicEmergencyPage({ apiHost }) {
  const { qrId = '' } = useParams();
  const [profile, setProfile] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceNote, setServiceNote] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchJson(`${apiHost}/api/public/emergency/${encodeURIComponent(qrId)}`, controller.signal)
      .then(setProfile)
      .catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [apiHost, qrId]);

  useEffect(() => {
    let active = true;
    const loadDirectories = async (latitude, longitude) => {
      setServicesLoading(true);
      const query = latitude === undefined ? '' : `?latitude=${latitude}&longitude=${longitude}`;
      const [hospitalResult, ambulanceResult] = await Promise.allSettled([
        fetchJson(`${apiHost}/api/hospitals/${latitude === undefined ? 'all' : 'nearby'}${query}`),
        fetchJson(`${apiHost}/api/ambulances/${latitude === undefined ? 'all' : 'nearby'}${query}`),
      ]);
      if (!active) return;
      setHospitals(hospitalResult.status === 'fulfilled' ? hospitalResult.value : []);
      setAmbulances(ambulanceResult.status === 'fulfilled' ? ambulanceResult.value : []);
      if (hospitalResult.status === 'rejected' && ambulanceResult.status === 'rejected') {
        setServiceNote('Emergency-service directory is temporarily unavailable.');
      } else if (latitude === undefined) {
        setServiceNote('Location was not shared; showing the available directory.');
      }
      setServicesLoading(false);
    };

    if (!navigator.geolocation) {
      void loadDirectories();
    } else {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => { void loadDirectories(coords.latitude, coords.longitude); },
        () => { void loadDirectories(); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
    return () => { active = false; };
  }, [apiHost]);

  return <main className="public-page">
    <header className="public-header">
      <div className="public-brand"><div className="public-mark"><ShieldAlert size={22} /></div><div><strong>Scan2Rescue</strong><span>VEHICLE EMERGENCY CARD</span></div></div>
      <span className="public-live"><i /> Emergency information</span>
    </header>
    {loading ? <div className="public-state">Loading emergency information...</div> : error ? <div className="public-state public-error"><strong>Emergency card unavailable</strong><p>{error}</p></div> : profile && <>
      <section className="public-owner">
        <div><p className="public-eyebrow">VEHICLE OWNER</p><h1>{profile.fullName}</h1><p className="public-owner-phone">{profile.phone ? <a href={`tel:${profile.phone}`}><Phone size={16} /> Call owner · {profile.phone}</a> : 'Owner phone not listed'}</p></div>
        <div className="public-blood"><span>BLOOD GROUP</span><strong>{profile.bloodGroup || 'Not listed'}</strong></div>
      </section>
      <div className="public-grid">
        <section className="public-section">
          <div className="public-section-heading"><span className="public-vehicle-mark">V</span><h2>Vehicle details</h2></div>
          {profile.vehicle?.registrationNumber || profile.vehicle?.type ? <dl className="public-details">
            <div><dt>Registration</dt><dd>{profile.vehicle.registrationNumber || 'Not listed'}</dd></div>
            <div><dt>Vehicle</dt><dd>{[profile.vehicle.type, profile.vehicle.makeModel].filter(Boolean).join(' · ') || 'Not listed'}</dd></div>
            <div><dt>Color</dt><dd>{profile.vehicle.color || 'Not listed'}</dd></div>
          </dl> : <p className="public-muted">Vehicle details have not been added.</p>}
        </section>
        <section className="public-section">
          <div className="public-section-heading"><HeartPulse size={19} /><h2>Medical information</h2></div>
          <dl className="public-details"><div><dt>Allergies</dt><dd>{profile.allergies || 'None listed'}</dd></div><div><dt>Medical conditions</dt><dd>{profile.medicalConditions || 'None listed'}</dd></div></dl>
        </section>
      </div>
      <section className="public-section public-contacts">
        <div className="public-section-heading"><Phone size={19} /><h2>Emergency contacts</h2></div>
        {profile.emergencyContacts?.length ? profile.emergencyContacts.map((contact) => <article className="public-contact" key={`${contact.phone}-${contact.name}`}><div><strong>{contact.name}</strong><span>{contact.relation}</span></div><a className="public-call" href={`tel:${contact.phone}`}><Phone size={16} /> Call {contact.phone}</a></article>) : <p className="public-muted">No emergency contacts listed.</p>}
      </section>
      <div className="public-section-heading public-nearby-title"><MapPin size={19} /><h2>Nearby emergency help</h2></div>
      {servicesLoading ? <div className="public-state">Finding nearby services...</div> : <div className="public-grid">
        <ResourceList title="Hospitals" icon={HeartPulse} items={hospitals} emptyMessage="No hospitals are listed nearby." locationLabel={serviceNote} />
        <ResourceList title="Ambulances" icon={Ambulance} items={ambulances} emptyMessage="No available ambulances are listed nearby." />
      </div>}
    </>}
    <footer className="public-footer">Scan2Rescue · If this is an emergency, contact local emergency services.</footer>
  </main>;
}