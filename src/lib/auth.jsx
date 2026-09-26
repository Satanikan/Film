import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    api('/auth/me', { signal: ctrl.signal })
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setReady(true));
    return () => ctrl.abort();
  }, []);

  const login = useCallback(async (login, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { login, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (fields) => {
    const data = await api('/auth/register', { method: 'POST', body: fields });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Разрешаем возврат после входа только на внутренние страницы сайта:
// ссылка вида /sign?next=https://evil.example не уведёт на фишинговый сайт.
export function safeRedirect(next) {
  return typeof next === 'string' && /^\/(?![/\\])[\w\-/?=&%.]*$/.test(next) ? next : '/';
}
