import Hospitals from '../components/Hospitals';

export default function HospitalsPage({ token, apiHost }) {
  return <Hospitals token={token} apiHost={apiHost} />;
}
