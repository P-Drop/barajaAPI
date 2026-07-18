import { describe, it, expect } from 'vitest';
import { createGame, type Rng } from '../../../src/games/orda/deck.js';
import { applyMove } from '../../../src/games/orda/applyMove.js';
import { legalMoves } from '../../../src/games/orda/legalMoves.js';
import { countCards } from './helpers.js';

const seededRng =
  (seed: number): Rng =>
  () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

const playRandomGame = (rng: Rng) => {
  let state = createGame(rng);
  let guard = 0;
  let freeThisRound = 0;

  while (state.status === 'IN_PROGRESS') {
    if (guard++ > 5000)
      throw new Error('la partida no termina (posible ciclo)');

    let move;
    if (state.hand !== null) {
      const options = legalMoves(state);
      move = options[Math.floor(rng() * options.length)];
    } else if (state.stock.length > 0) {
      const free = legalMoves(state).filter((m) => m.type === 'PLACE');
      if (free.length > 0 && freeThisRound < 3 && rng() < 0.5) {
        move = free[Math.floor(rng() * free.length)];
        freeThisRound++;
      } else {
        move = { type: 'DRAW' } as const;
        freeThisRound = 0;
      }
    } else {
      move = { type: 'ABANDON' } as const;
    }

    const result = applyMove(state, move);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(countCards(result.state)).toBe(50);
    state = result.state;
  }
  return state;
};

describe('propiedad: partidas aleatorias completas', () => {
  it('200 partidas conservan 50 cartas y terminan en WON/LOST', () => {
    for (let seed = 0; seed < 200; seed++) {
      const final = playRandomGame(seededRng(seed));
      expect(['WON', 'LOST']).toContain(final.status);
      expect(countCards(final)).toBe(50);
    }
  }, 2000); // timeout explícito: red de seguridad ante runners lentos
});
