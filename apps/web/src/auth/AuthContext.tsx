import { createContext } from 'react';
import type { Profile, LoginBody, RegisterBody } from '../api/client';

export type AuthState = {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
