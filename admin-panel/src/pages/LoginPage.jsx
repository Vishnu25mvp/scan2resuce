import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  return <Login onLogin={login} apiHost={API_URL} />;
}
