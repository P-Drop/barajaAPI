import { describe, it, expect } from 'vitest';
import { applyMove } from '../../../src/games/orda/applyMove.js';
import { baseState, countCards } from './helpers.js';

describe('Guards y fin de partida', () => {
  it.each([['WON'], ['LOST']] as const)(
    'estado %s -> no se permiten más movimientos',
    (status) => {
      const result = applyMove(baseState({ status }), { type: 'DRAW' });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toBe('la partida ha terminado');
    },
  );

  it('Abandonar (movimiento legal) -> estado "LOST"', () => {
    const result = applyMove(baseState(), { type: 'ABANDON' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe('LOST');
  });
});

describe('DRAW', () => {
  it('robar carta -> round +1 y stock -1', () => {
    const result = applyMove(baseState({ stock: ['BASTOS-8'] }), {
      type: 'DRAW',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.round).toBe(1);
    expect(result.state.stock).toHaveLength(0);
  });

  it('robar un comodín -> suma estrella, mano vacía y round +1', () => {
    const result = applyMove(baseState({ stock: ['JOKER-1'] }), {
      type: 'DRAW',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starsAvailable).toBe(1);
    expect(result.state.round).toBe(1);
    expect(result.state.hand).toBeNull();
  });

  it('robar con carta en mano -> movimiento ilegal', () => {
    const result = applyMove(baseState({ hand: 'COPAS-3' }), { type: 'DRAW' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('hay una carta en la mano');
  });

  it('stock vacío -> movimiento ilegal', () => {
    const result = applyMove(baseState({ stock: [] }), { type: 'DRAW' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('no quedan cartas para robar');
  });
});

describe('PLACE desde la mano', () => {
  it('a un hueco -> legal y la mano se vacía', () => {
    const result = applyMove(baseState({ hand: 'COPAS-11' }), {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'cross', index: 0 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.hand).toBeNull();
  });

  it('legal sobre carta de la cruz', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-4',
        cross: [['BASTOS-5'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(true);
  });

  it('ilegal sobre carta de la cruz (mismo palo)', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-4',
        cross: [['COPAS-5'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('legal sobre esquina', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-1',
        corners: {
          OROS: 3,
          COPAS: 0,
          ESPADAS: 5,
          BASTOS: 1,
        },
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'corner', suit: 'COPAS' },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.corners['COPAS']).toBe(1);
  });

  it('ilegal sobre esquina', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-10',
        corners: {
          OROS: 3,
          COPAS: 6,
          ESPADAS: 5,
          BASTOS: 1,
        },
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'corner', suit: 'COPAS' },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('a descarte (siempre legal)', () => {
    const result = applyMove(baseState({ hand: 'COPAS-4' }), {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'discard' },
    });

    expect(result.ok).toBe(true);
  });
});

describe('Bloqueo de mano', () => {
  it('PLACE desde la cruz con mano ocupada -> ilegal', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-4',
        cross: [['BASTOS-3'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'discard' },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(
      'tienes una carta en mano: solo puedes jugar esta',
    );
  });
});

describe('Movimientos entre montones', () => {
  it('cruz -> cruz (legal)', () => {
    const result = applyMove(
      baseState({
        cross: [['OROS-5'], ['ESPADAS-6'], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'cross', index: 1 },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.cross).toStrictEqual([
      [],
      ['ESPADAS-6', 'OROS-5'],
      [],
      [],
      [],
    ]);
  });

  it('cruz -> cruz (ilegal)', () => {
    const result = applyMove(
      baseState({
        cross: [['BASTOS-3'], ['COPAS-4', 'OROS-3'], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'cross', index: 1 },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('esquina -> cruz (legal) : desmonta', () => {
    const result = applyMove(
      baseState({
        corners: {
          OROS: 2,
          COPAS: 0,
          ESPADAS: 0,
          BASTOS: 0,
        },
        cross: [['BASTOS-3'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'corner', suit: 'OROS' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.corners['OROS']).toBe(1);
    expect(result.state.cross).toStrictEqual([
      ['BASTOS-3', 'OROS-2'],
      [],
      [],
      [],
      [],
    ]);
  });

  it('esquina -> cruz (ilegal): no desmonta', () => {
    const result = applyMove(
      baseState({
        corners: {
          OROS: 5,
          COPAS: 0,
          ESPADAS: 0,
          BASTOS: 0,
        },
        cross: [['BASTOS-2'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'corner', suit: 'OROS' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('descarte -> cruz (legal)', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12', 'ESPADAS-7'],
        cross: [['BASTOS-8'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'discard' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.discard).toStrictEqual(['OROS-12']);
    expect(result.state.cross).toStrictEqual([
      ['BASTOS-8', 'ESPADAS-7'],
      [],
      [],
      [],
      [],
    ]);
  });

  it('descarte -> cruz (ilegal)', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12', 'ESPADAS-7'],
        cross: [['BASTOS-9'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'discard' },
        to: { zone: 'cross', index: 0 },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('descarte -> esquina (legal): monta', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12', 'ESPADAS-7'],
        corners: {
          OROS: 0,
          COPAS: 0,
          ESPADAS: 6,
          BASTOS: 0,
        },
      }),
      {
        type: 'PLACE',
        from: { zone: 'discard' },
        to: { zone: 'corner', suit: 'ESPADAS' },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.discard).toStrictEqual(['OROS-12']);
    expect(result.state.corners['ESPADAS']).toBe(7);
  });

  it('descarte -> esquina (ilegal): no monta', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12', 'ESPADAS-7'],
        corners: {
          OROS: 0,
          COPAS: 0,
          ESPADAS: 0,
          BASTOS: 6,
        },
      }),
      {
        type: 'PLACE',
        from: { zone: 'discard' },
        to: { zone: 'corner', suit: 'BASTOS' },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('cruz -> descarte (siempre legal)', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12', 'ESPADAS-7'],
        cross: [['BASTOS-8'], [], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'discard' },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.discard).toStrictEqual([
      'OROS-12',
      'ESPADAS-7',
      'BASTOS-8',
    ]);
    expect(result.state.cross).toStrictEqual([[], [], [], [], []]);
  });

  it('esquina -> descarte (siempre legal): desmonta', () => {
    const result = applyMove(
      baseState({
        discard: ['OROS-12'],
        corners: {
          OROS: 0,
          COPAS: 0,
          ESPADAS: 6,
          BASTOS: 0,
        },
      }),
      {
        type: 'PLACE',
        from: { zone: 'corner', suit: 'ESPADAS' },
        to: { zone: 'discard' },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.discard).toStrictEqual(['OROS-12', 'ESPADAS-6']);
    expect(result.state.corners['ESPADAS']).toBe(5);
  });
});

describe('Pureza', () => {
  it('el reductor no muta la entrada', () => {
    const originalState = baseState({
      discard: ['OROS-12'],
      corners: {
        OROS: 11,
        COPAS: 0,
        ESPADAS: 6,
        BASTOS: 0,
      },
    });

    const result = applyMove(originalState, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'corner', suit: 'OROS' },
    });

    expect(result.ok).toBe(true);
    expect(originalState).toStrictEqual(
      baseState({
        discard: ['OROS-12'],
        corners: {
          OROS: 11,
          COPAS: 0,
          ESPADAS: 6,
          BASTOS: 0,
        },
      }),
    );
  });
});

describe('Victoria', () => {
  it('status -> WON', () => {
    const result = applyMove(
      baseState({
        hand: 'COPAS-12',
        corners: {
          OROS: 12,
          COPAS: 11,
          ESPADAS: 12,
          BASTOS: 12,
        },
        starsAvailable: 2,
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'corner', suit: 'COPAS' },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe('WON');

    expect(countCards(result.state)).toBe(50);
  });
});

describe('Orígenes vacíos o inválidos', () => {
  it.each([
    ['mano vacía', { hand: null }, { zone: 'hand' } as const],
    ['cruz vacía', {}, { zone: 'cross', index: 0 } as const],
    ['esquina vacía', {}, { zone: 'corner', suit: 'BASTOS' } as const],
    ['descarte vacío', {}, { zone: 'discard' } as const],
  ])('PLACE desde %s -> rechazado', (_n, over, from) => {
    const result = applyMove(baseState(over), {
      type: 'PLACE',
      from,
      to: { zone: 'discard' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('origen vacío');
  });
});
