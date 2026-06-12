import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('forestroots_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('forestroots_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    persistSession(data);
    return data.user;
  }

  function persistSession(data) {
    localStorage.setItem('forestroots_token', data.token);
    localStorage.setItem('forestroots_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('forestroots_token');
    localStorage.removeItem('forestroots_user');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, login, register, logout, isAuthenticated: Boolean(token) }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

