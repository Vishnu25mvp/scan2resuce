import AdminManagement from '../components/AdminManagement';

export default function AdminManagementPage({ token, apiHost, admin }) {
  return <AdminManagement token={token} apiHost={apiHost} currentAdmin={admin} />;
}
