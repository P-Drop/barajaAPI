import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/repositories/cardRepository.js', () => ({
  cardRepository: {
    findFullDeck: vi.fn(),
    findShortDeck: vi.fn(),
  },
}));

import app from '../../src/app.js';
import { cardRepository } from '../../src/repositories/cardRepository.js';

const fakeDeck = [
  {
    id: 1,
    value: 1,
    suit: 'OROS' as const,
    isJoker: false,
    name: 'As de oros',
  },
  {
    id: 2,
    value: 12,
    suit: 'BASTOS' as const,
    isJoker: false,
    name: 'Rey de bastos',
  },
  { id: 3, value: null, suit: null, isJoker: true, name: 'Comodín' },
  {
    id: 4,
    value: 7,
    suit: 'COPAS' as const,
    isJoker: false,
    name: 'Siete de copas',
  },
  {
    id: 5,
    value: 10,
    suit: 'ESPADAS' as const,
    isJoker: false,
    name: 'Sota de espadas',
  },
];

type CardResponse = (typeof fakeDeck)[number] & { image: string };

beforeEach(() => {
  vi.mocked(cardRepository.findFullDeck).mockResolvedValue(fakeDeck);
  vi.mocked(cardRepository.findShortDeck).mockResolvedValue(
    fakeDeck.slice(0, 2),
  );
});

describe('Tests suite for Deck v1 API', () => {
  it('Se obtiene la baraja completa, con status 200 y cada carta trae su image', async () => {
    const response = await request(app).get('/api/v1/deck');

    expect(response.status).toBe(200);

    const cards = response.body as CardResponse[];
    expect(cards).toHaveLength(fakeDeck.length);

    const joker = cards.find((c) => c.isJoker);
    expect(joker).toBeDefined();
    expect(joker!.image).toBe('joker.png');

    const asOros = cards.find((c) => c.name === 'As de oros');
    expect(asOros).toBeDefined();
    expect(asOros!.image).toBe('oros_1.png');
  });

  it('Obtener baraja reducida (findShortDeck) con parametro short=true', async () => {
    const response = await request(app).get('/api/v1/deck?short=true');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(cardRepository.findShortDeck).toHaveBeenCalled();
    expect(cardRepository.findFullDeck).not.toHaveBeenCalled();
  });

  it('Robar (/deck/draw) con count=2 con status 200 y devuelve dos cartas', async () => {
    const response = await request(app).get('/api/v1/deck/draw?count=2');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('Error 400: Bad Request -> DomainError cuando se intentan robar demasiadas cartas', async () => {
    const response = await request(app).get('/api/v1/deck/draw?count=999');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      'No puedes robar más cartas de las que hay',
    );
  });

  it('Error 400: Bad Request -> Validación del tipado de los parámetros', async () => {
    const response = await request(app).get('/api/v1/deck/draw?count=abc');

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Parámetros inválidos');
    expect(response.body).toHaveProperty('details');
  });

  it('barajar devuelve el mismo conjunto de cartas (status 200)', async () => {
    const response = await request(app).get('/api/v1/deck/shuffle');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(fakeDeck.length);
  });
});
