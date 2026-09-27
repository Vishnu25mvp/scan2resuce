import Dashboard from '../components/Dashboard';

export default function DashboardPage({ alerts, stats, token, apiHost, onResolve }) {
  return <Dashboard alerts={alerts} stats={stats} token={token} apiHost={apiHost} onResolve={onResolve} />;
}
