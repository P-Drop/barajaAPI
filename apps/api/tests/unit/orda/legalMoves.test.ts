import { describe, it, expect } from 'vitest';
import { legalMoves } from '../../../src/games/orda/legalMoves.js';
import { baseState } from './helpers.js';
import { createGame } from '../../../src/games/orda/deck.js';

describe('legalMoves', () => {
  it('partida finalizada (WON) -> no más movimientos', () => {
    const moves = legalMoves(baseState({ status: 'WON' }));

    expect(moves).toStrictEqual([]);
  });

  it('carta en mano sin posiciones -> movimiento descarte', () => {
    const moves = legalMoves(
      baseState({
        hand: 'COPAS-7',
        cross: [
          ['OROS-3'],
          ['BASTOS-12'],
          ['COPAS-8'],
          ['ESPADAS-9'],
          ['OROS-7'],
        ],
      }),
    );

    expect(moves).toStrictEqual([
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'discard' },
      },
    ]);
  });

  it('juego recién creado -> robar movimiento legal', () => {
    const moves = legalMoves(createGame(Math.random));

    expect(moves).toContainEqual({ type: 'DRAW' });
  });
});
