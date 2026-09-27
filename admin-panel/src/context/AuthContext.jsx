import React, { createContext, useContext, useMemo, useState } from 'react';
import { API_URL } from '../lib/api';

const AuthContext = createContext(null);

function readAdmin() {
  try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [admin, setAdmin] = useState(readAdmin);

  const login = (nextToken, nextAdmin) => {
    localStorage.setItem('admin_token', nextToken);
    localStorage.setItem('admin_user', JSON.stringify(nextAdmin));
    setToken(nextToken);
    setAdmin(nextAdmin);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken('');
    setAdmin(null);
  };

  const value = useMemo(() => ({ token, admin, login, logout, apiUrl: API_URL }), [token, admin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
