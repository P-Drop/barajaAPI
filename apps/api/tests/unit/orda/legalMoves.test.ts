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

  it('mano vacía y mazo agotado (endGame) -> no incluye DRAW', () => {
  const moves = legalMoves(
    baseState({
      stock: [],
      cross: [['OROS-5'], ['BASTOS-6'], [], [], []],
    }),
  );
  expect(moves).not.toContainEqual({ type: 'DRAW' });
  // pero sí las colocaciones legales (OROS-5 sobre BASTOS-6)
  expect(moves).toContainEqual({
    type: 'PLACE',
    from: { zone: 'cross', index: 0 },
    to: { zone: 'cross', index: 1 },
  });
});

});
