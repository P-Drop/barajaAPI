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
    const moves = legalMoves(createGame(Math.random, { stairway: false }));

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

  it('Bonus slots desbloqueados -> origen y destino legales', () => {
    const moves = legalMoves(
      baseState({
        extra: ['OROS-5', null],
        cross: [['COPAS-6'], [], [], [], []],
      }),
    );

    // Carta slot -> cruz
    expect(moves).toContainEqual({
      type: 'PLACE',
      from: { zone: 'extra', index: 0 },
      to: { zone: 'cross', index: 0 },
    });

    // Carta cruz -> slot libre
    expect(moves).toContainEqual({
      type: 'PLACE',
      from: { zone: 'cross', index: 0 },
      to: { zone: 'extra', index: 1 },
    });
  });

  it('Bonus slots no desbloqueados -> no incluidos', () => {
    const moves = legalMoves(
      baseState({
        extra: [],
        cross: [['COPAS-6'], [], [], [], []],
      }),
    );

    // Carta cruz -> No existe slot
    expect(moves).not.toContainEqual({
      type: 'PLACE',
      from: { zone: 'cross', index: 0 },
      to: { zone: 'extra', index: 0 },
    });
  });

  it('Con Star disponible -> desbloquear extra slot incluido', () => {
    const moves = legalMoves(
      baseState({
        starsAvailable: 1,
      }),
    );

    expect(moves).toContainEqual({
      type: 'USE_STAR_EXTRA_SLOT',
    });
  });

  it('Con Star disponible -> recuperar carta de descarte incluido', () => {
    const moves = legalMoves(
      baseState({
        starsAvailable: 1,
        discard: ['OROS-2', 'BASTOS-3', 'ESPADAS-11'],
      }),
    );

    expect(moves).toContainEqual({
      type: 'USE_STAR_RECOVER',
      cardId: 'OROS-2',
    });
  });

  it('Sin Stars -> no incluye recuperar carta ni extra slot', () => {
    const moves = legalMoves(
      baseState({
        starsAvailable: 0,
        discard: ['OROS-7', 'COPAS-3'],
      }),
    );

    expect(moves).not.toContainEqual({
      type: 'USE_STAR_EXTRA_SLOT',
    });

    expect(moves).not.toContainEqual({
      type: 'USE_STAR_RECOVER',
      cardId: 'OROS-7',
    });
  });

  it('Con logro Stairway -> incluye movimiento en bloque', () => {
    const moves = legalMoves(
      baseState({
        stairwayUnlocked: true,
        cross: [['COPAS-10'], ['BASTOS-9', 'OROS-8', 'ESPADAS-7'], [], [], []],
      }),
    );

    expect(moves).toContainEqual({
      type: 'MOVE_STACK',
      fromPile: 1,
      cardIndex: 0,
      toPile: 0,
    });

    expect(moves).toContainEqual({
      type: 'MOVE_STACK',
      fromPile: 1,
      cardIndex: 0,
      toPile: 4,
    });

    expect(moves).toContainEqual({
      type: 'MOVE_STACK',
      fromPile: 1,
      cardIndex: 1,
      toPile: 2,
    });
  });

  it('Sin logro Stairway -> no incluye movimiento en bloque', () => {
    const moves = legalMoves(
      baseState({
        stairwayUnlocked: false,
        cross: [['COPAS-10'], ['BASTOS-9', 'OROS-8', 'ESPADAS-7'], [], [], []],
      }),
    );

    expect(moves).not.toContainEqual({
      type: 'MOVE_STACK',
      fromPile: 1,
      cardIndex: 0,
      toPile: 0,
    });
  });
});
