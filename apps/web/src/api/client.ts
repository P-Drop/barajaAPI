import type { paths } from './generated/schema';

// Tipos derivados del contrato (no se duplican)
export type Deck =
  paths['/api/v1/deck']['get']['responses'][200]['content']['application/json'];
export type Card = Deck[number];

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Error con el status HTTP
export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`Error ${status} al obtener la baraja`);
    this.name = 'ApiError';
    this.status = status;
  }
}

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
