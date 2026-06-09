import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, fetchMe, loginRequest, registerRequest, setAuthToken } from './api';

const STORAGE_KEY = 'bottle-deposit/auth';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const connectSocket = useCallback((authToken, userId) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const socket = io(SOCKET_URL, { auth: { token: authToken } });
    socket.on('bottle-count-updated', (payload) => {
      setUser((prev) => (prev && prev.id === userId ? { ...prev, bottleCount: payload.bottleCount } : prev));
    });
    socketRef.current = socket;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setAuthToken(parsed.token);
          setToken(parsed.token);
          setUser(parsed.user);
          connectSocket(parsed.token, parsed.user.id);
          fetchMe()
            .then(({ user: freshUser }) => {
              setUser(freshUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: parsed.token, user: freshUser }));
            })
            .catch(() => {
              localStorage.removeItem(STORAGE_KEY);
              setAuthToken(null);
              setToken(null);
              setUser(null);
            });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (authToken, authUser) => {
    setAuthToken(authToken);
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: authToken, user: authUser }));
    connectSocket(authToken, authUser.id);
  };

  const login = async (email, password) => {
    const { token: authToken, user: authUser } = await loginRequest(email, password);
    persist(authToken, authUser);
  };

  const register = async (name, email, password, phone) => {
    const { token: authToken, user: authUser } = await registerRequest(name, email, password, phone);
    persist(authToken, authUser);
  };

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const applyBottleUpdate = (bottleCount) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, bottleCount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: next }));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, applyBottleUpdate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
