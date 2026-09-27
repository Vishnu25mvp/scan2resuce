import Ambulances from '../components/Ambulances';

export default function AmbulancesPage({ token, apiHost }) {
  return <Ambulances token={token} apiHost={apiHost} />;
}