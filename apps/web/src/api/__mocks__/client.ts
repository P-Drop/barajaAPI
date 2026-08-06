import { vi } from 'vitest';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `Error ${status} de la API`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getDeck = vi.fn();
export const getShuffledDeck = vi.fn();
export const register = vi.fn();
export const login = vi.fn();
export const getProfile = vi.fn();
export const createMatch = vi.fn();
export const getMatch = vi.fn();
export const getActiveMatch = vi.fn();
export const applyMove = vi.fn();
export const getRanking = vi.fn();
