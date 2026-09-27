import Users from '../components/Users';

export default function UsersPage({ token, apiHost }) {
  return <Users token={token} apiHost={apiHost} />;
}
