import { Navigate, Route, Routes } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import MachinesPage from './pages/MachinesPage';
import ScansPage from './pages/ScansPage';
import './App.css';

export default function App() {
  const { loading } = useAdminAuth();
  if (loading) return <div className="loading-screen">লোড হচ্ছে...</div>;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="machines" element={<MachinesPage />} />
        <Route path="scans" element={<ScansPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
