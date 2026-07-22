import { describe, it, expect } from 'vitest';

import {
  buildDeck,
  shuffle,
  dealGame,
  createGame,
} from '../../../src/games/orda/deck.js';

import { countCards } from './helpers.js';

import type { Rng } from '../../../src/games/orda/deck.js';

const seededRng =
  (seed: number): Rng =>
  () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

describe('buildDeck', () => {
  it('50 cartas sin duplicados', () => {
    const deck = buildDeck();

    expect(new Set(deck)).toHaveLength(50);
  });

  it('contiene cartas correctas', () => {
    const deck = buildDeck();

    expect(deck).toContain('OROS-1');
    expect(deck).toContain('BASTOS-12');
    expect(deck).not.toContain('OROS-0');
  });

  it('contiene 2 comodines', () => {
    const deck = buildDeck();
    const jokers = deck.filter((s) => s.includes('JOKER'));

    expect(deck).toContain('JOKER-1');
    expect(deck).toContain('JOKER-2');
    expect(jokers).toHaveLength(2);
  });
});

describe('shuffle', () => {
  it('conserva las mismas 50 cartas', () => {
    const deckShuffled = shuffle(buildDeck(), Math.random);

    expect(new Set(deckShuffled)).toHaveLength(50);
  });

  it('no muta el array original', () => {
    const deck = buildDeck();
    const snapshot = [...deck];
    shuffle(deck, Math.random);
    expect(deck).toEqual(snapshot);
  });

  it('misma semilla -> mismo orden', () => {
    const firstDeck = shuffle(buildDeck(), seededRng(42));
    const secondDeck = shuffle(buildDeck(), seededRng(42));

    expect(firstDeck).toEqual(secondDeck);
  });

  it('distinta semilla -> distinto orden', () => {
    const firstDeck = shuffle(buildDeck(), seededRng(42));
    const secondDeck = shuffle(buildDeck(), seededRng(33));

    expect(firstDeck).not.toEqual(secondDeck);
  });
});

describe('dealGame', () => {
  it('cruz de 5 pilas de 1 carta y stock de 45 con mazo sin comodines al frente', () => {
    const deck = buildDeck();
    const game = dealGame(deck);

    expect(game.cross).toHaveLength(5);
    expect(game.stock).toHaveLength(45);
  });

  it('"JOKER-1" entre las 5 primeras => hueco + estrella', () => {
    const pimpDeck = buildDeck();
    [pimpDeck[3], pimpDeck[48]] = [pimpDeck[48], pimpDeck[3]];
    const game = dealGame(pimpDeck);

    expect(game.cross).toStrictEqual([
      ['OROS-1'],
      ['OROS-2'],
      ['OROS-3'],
      [],
      ['OROS-5'],
    ]);
    expect(game.starsAvailable).toBe(1);
  });

  it('dos comodines al frente => 2 huecos + 2 estrellas', () => {
    const pimpDeck = buildDeck();
    [pimpDeck[3], pimpDeck[48]] = [pimpDeck[48], pimpDeck[3]];
    [pimpDeck[1], pimpDeck[49]] = [pimpDeck[49], pimpDeck[1]];
    const game = dealGame(pimpDeck);

    expect(game.cross).toStrictEqual([
      ['OROS-1'],
      [],
      ['OROS-3'],
      [],
      ['OROS-5'],
    ]);
    expect(game.starsAvailable).toBe(2);
  });
});

describe('createGame', () => {
  it('esquinas a cero y estado inicial correcto', () => {
    const game = createGame(seededRng(1), { stairway: false });

    expect(Object.values(game.corners)).toEqual([0, 0, 0, 0]);

    expect(game.schemaVersion).toBe(1);
    expect(game.hand).toBeNull();
    expect(game.discard).toEqual([]);
    expect(game.round).toBe(0);
    expect(game.starsUsed).toBe(0);
    expect(game.moveCount).toBe(0);
    expect(game.status).toBe('IN_PROGRESS');
  });

  it('50 cartas totales', () => {
    const game = createGame(seededRng(1));

    expect(countCards(game)).toBe(50);
  });
});
