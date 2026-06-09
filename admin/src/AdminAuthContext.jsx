import { createContext, useContext, useEffect, useState } from 'react';
import { adminLoginRequest, setAdminToken } from './api';

const STORAGE_KEY = 'bottle-deposit/admin-auth';
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.admin) {
          setAdminToken(parsed.token);
          setToken(parsed.token);
          setAdmin(parsed.admin);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // No login page for this prototype — sign in automatically using the
    // built-in admin credentials so the dashboard loads directly.
    const email = import.meta.env.VITE_ADMIN_EMAIL || 'admin@punoshristi.com';
    const password = import.meta.env.VITE_ADMIN_PASSWORD || 'admin@1234';
    adminLoginRequest(email, password)
      .then(({ token: authToken, admin: adminInfo }) => {
        setAdminToken(authToken);
        setToken(authToken);
        setAdmin(adminInfo);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: authToken, admin: adminInfo }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token: authToken, admin: adminInfo } = await adminLoginRequest(email, password);
    setAdminToken(authToken);
    setToken(authToken);
    setAdmin(adminInfo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: authToken, admin: adminInfo }));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminToken(null);
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
