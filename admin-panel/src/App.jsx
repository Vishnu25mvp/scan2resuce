import React from 'react';
import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import HospitalsPage from './pages/HospitalsPage';
import AdminManagementPage from './pages/AdminManagementPage';
import QrDirectoryPage from './pages/QrDirectoryPage';
import StickerOrdersPage from './pages/StickerOrdersPage';
import AmbulancesPage from './pages/AmbulancesPage';
import PublicEmergencyPage from './pages/PublicEmergencyPage';
import { API_URL } from './lib/api';

function DashboardRoute() {
  return <DashboardPage {...useOutletContext()} />;
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/emergency/:qrId" element={<PublicEmergencyPage apiHost={API_URL} />} />
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardRoute />} />
          <Route path="users" element={<UsersPage token={token} apiHost={API_URL} />} />
          <Route path="hospitals" element={<HospitalsPage token={token} apiHost={API_URL} />} />
          <Route path="ambulances" element={<AmbulancesPage token={token} apiHost={API_URL} />} />
          <Route path="sticker-orders" element={<StickerOrdersPage token={token} apiHost={API_URL} />} />
          <Route path="admins" element={<AdminManagementPage token={token} apiHost={API_URL} admin={JSON.parse(localStorage.getItem('admin_user') || 'null')} />} />
          <Route path="qr-directory" element={<QrDirectoryPage token={token} apiHost={API_URL} />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
