import type { paths } from './generated/schema';

// Tipos derivados del contrato (no se duplican)
export type Deck =
  paths['/api/v1/deck']['get']['responses'][200]['content']['application/json'];
export type Card = Deck[number];

export type RegisterBody =
  paths['/api/v1/auth/register']['post']['requestBody']['content']['application/json'];
export type RegisterResponse =
  paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json'];

export type LoginBody =
  paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
export type LoginResponse =
  paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];

export type Profile =
  paths['/api/v1/profile']['get']['responses'][200]['content']['application/json'];

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Error con el status HTTP
export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`Error ${status} de la API`);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Deck
async function fetchDeck(path: string, short: boolean): Promise<Deck> {
  const url = new URL(path, baseUrl);
  if (short) url.searchParams.set('short', 'true');
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<Deck>;
}

export function getDeck(short = false): Promise<Deck> {
  return fetchDeck('/api/v1/deck', short);
}

export async function getShuffledDeck(short = false): Promise<Deck> {
  return fetchDeck('/api/v1/deck/shuffle', short);
}

// Users
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(new URL(path, baseUrl), init);
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function register(body: RegisterBody): Promise<RegisterResponse> {
  return apiFetch('/api/v1/auth/register', jsonPost(body));
}

export function login(body: LoginBody): Promise<LoginResponse> {
  return apiFetch('/api/v1/auth/login', jsonPost(body));
}

export function getProfile(token: string): Promise<Profile> {
  return apiFetch('/api/v1/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
