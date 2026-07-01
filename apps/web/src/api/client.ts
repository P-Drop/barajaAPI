import type { paths } from './generated/schema';

// Tipos derivados del contrato (no se duplican)
export type Deck =
  paths['/api/v1/deck']['get']['responses'][200]['content']['application/json'];
export type Card = Deck[number];

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export async function getDeck(short = false): Promise<Deck> {
  const url = new URL('/api/v1/deck', baseUrl);
  if (short) url.searchParams.set('short', 'true');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} al obtener la baraja`);
  return res.json() as Promise<Deck>;
}
