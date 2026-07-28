import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import * as api from '../api/client';
import type { Profile, LoginBody, RegisterBody } from '../api/client';
import { AuthContext } from './AuthContext';

const TOKEN_KEY = 'baraja_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY)),
  );

  // Rehidratar: si al montar al token recuperar el pefil (cerrar si caducó)
  useEffect(() => {
    if (!token) return;
    api
      .getProfile(token)
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistToken = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const login = async (body: LoginBody) => {
    const { token: t } = await api.login(body);
    persistToken(t);
    setUser(await api.getProfile(t));
  };

  const register = async (body: RegisterBody) => {
    await api.register(body);
    // auto-login
    await login({
      nickname: body.nickname,
      password: body.password,
    });
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
