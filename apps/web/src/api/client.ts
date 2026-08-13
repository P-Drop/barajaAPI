import type { paths, components } from './generated/schema';

// Tipos derivados del contrato (no se duplican)
export type Deck =
  paths['/api/v1/deck']['get']['responses'][200]['content']['application/json'];
export type Card = Deck[number];

export type RegisterBody =
  paths['/api/v1/auth/register']['post']['requestBody']['content']['application/json'];
export type Avatar = RegisterBody['avatar'];
export type RegisterResponse =
  paths['/api/v1/auth/register']['post']['responses'][201]['content']['application/json'];

export type LoginBody =
  paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
export type LoginResponse =
  paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json'];

export type Profile =
  paths['/api/v1/profile']['get']['responses'][200]['content']['application/json'];

export type MatchView = components['schemas']['MatchView'];
export type PlayerView = MatchView['view'];
export type MoveRequestBody =
  paths['/api/v1/matches/{id}/moves']['post']['requestBody']['content']['application/json'];
export type Move = MoveRequestBody['move'];
export type Position = Extract<Move, { type: 'PLACE' }>['to'];

export type Ranking =
  paths['/api/v1/ranking']['get']['responses'][200]['content']['application/json'];

// Error con el status HTTP
export class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `Error ${status} de la API`);
    this.name = 'ApiError';
    this.status = status;
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// fetch genérico
async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  short?: boolean,
): Promise<T> {
  const url = new URL(path, baseUrl);
  if (short) url.searchParams.set('short', 'true');

  const res = init ? await fetch(url, init) : await fetch(url);

  if (!res.ok) {
    let message: string | undefined;
    try {
      message = (await res.json())?.error;
    } catch {
      throw new ApiError(res.status);
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// Deck
export function getDeck(short = false): Promise<Deck> {
  return apiFetch('/api/v1/deck', undefined, short);
}

export async function getShuffledDeck(short = false): Promise<Deck> {
  return apiFetch('/api/v1/deck/shuffle', undefined, short);
}

// Helper Auth
function authed(token: string, init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  };
}

// Users
export function register(body: RegisterBody): Promise<RegisterResponse> {
  return apiFetch('/api/v1/auth/register', jsonPost(body));
}

export function login(body: LoginBody): Promise<LoginResponse> {
  return apiFetch('/api/v1/auth/login', jsonPost(body));
}

export function getProfile(token: string): Promise<Profile> {
  return apiFetch('/api/v1/profile', authed(token));
}

// Match
export function createMatch(token: string): Promise<MatchView> {
  return apiFetch('/api/v1/matches', authed(token, { method: 'POST' }));
}

export function getMatch(token: string, id: string): Promise<MatchView> {
  return apiFetch(`/api/v1/matches/${id}`, authed(token));
}

export function getActiveMatch(token: string): Promise<MatchView> {
  return apiFetch('/api/v1/matches/active', authed(token));
}

export function applyMove(
  token: string,
  id: string,
  body: MoveRequestBody,
): Promise<MatchView> {
  return apiFetch(`/api/v1/matches/${id}/moves`, authed(token, jsonPost(body)));
}

// Ranking (público)
export function getRanking(limit: number, offset: number): Promise<Ranking> {
  return apiFetch(`/api/v1/ranking?limit=${limit}&offset=${offset}`);
}
