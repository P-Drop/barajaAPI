import { vi } from 'vitest';

export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`Error ${status} de la API`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getDeck = vi.fn();
export const getShuffledDeck = vi.fn();
export const register = vi.fn();
export const login = vi.fn();
export const getProfile = vi.fn();
