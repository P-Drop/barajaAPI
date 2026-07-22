import { describe, it, expect } from 'vitest';
import { applyMove } from '../../../src/games/orda/applyMove.js';
import { baseState, countCards, applyOk } from './helpers.js';
import { legalMoves } from '../../../src/games/orda/legalMoves.js';

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
    const state = applyOk(baseState(), { type: 'ABANDON' });

    expect(state.status).toBe('LOST');
  });
});

describe('DRAW', () => {
  it('robar carta -> round +1 y stock -1', () => {
    const state = applyOk(baseState({ stock: ['BASTOS-8'] }), {
      type: 'DRAW',
    });

    expect(state.round).toBe(1);
    expect(state.stock).toHaveLength(0);
  });

  it('robar un comodín -> suma estrella, mano vacía y round +1', () => {
    const state = applyOk(baseState({ stock: ['JOKER-1'] }), {
      type: 'DRAW',
    });

    expect(state.starsAvailable).toBe(1);
    expect(state.round).toBe(1);
    expect(state.hand).toBeNull();
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
    const state = applyOk(baseState({ hand: 'COPAS-11' }), {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'cross', index: 0 },
    });

    expect(state.hand).toBeNull();
  });

  it('legal sobre carta de la cruz', () => {
    applyOk(
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
    const state = applyOk(
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

    expect(state.corners['COPAS']).toBe(1);
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
    applyOk(baseState({ hand: 'COPAS-4' }), {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'discard' },
    });
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
    const state = applyOk(
      baseState({
        cross: [['OROS-5'], ['ESPADAS-6'], [], [], []],
      }),
      {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'cross', index: 1 },
      },
    );

    expect(state.cross).toStrictEqual([
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
    const state = applyOk(
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

    expect(state.corners['OROS']).toBe(1);
    expect(state.cross).toStrictEqual([['BASTOS-3', 'OROS-2'], [], [], [], []]);
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
    const state = applyOk(
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

    expect(state.discard).toStrictEqual(['OROS-12']);
    expect(state.cross).toStrictEqual([
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
    const state = applyOk(
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

    expect(state.discard).toStrictEqual(['OROS-12']);
    expect(state.corners['ESPADAS']).toBe(7);
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
    const state = applyOk(
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

    expect(state.discard).toStrictEqual(['OROS-12', 'ESPADAS-7', 'BASTOS-8']);
    expect(state.cross).toStrictEqual([[], [], [], [], []]);
  });

  it('esquina -> descarte (siempre legal): desmonta', () => {
    const state = applyOk(
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

    expect(state.discard).toStrictEqual(['OROS-12', 'ESPADAS-6']);
    expect(state.corners['ESPADAS']).toBe(5);
  });

  it('PLACE a un índice de cruz inválido -> rechazado', () => {
    const result = applyMove(baseState({ hand: 'OROS-5' }), {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'cross', index: 9 },
    });
    expect(result.ok).toBe(false);
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

    applyOk(originalState, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'corner', suit: 'OROS' },
    });

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
    const state = applyOk(
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

    expect(state.status).toBe('WON');

    expect(countCards(state)).toBe(50);
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

describe('Bonus -> espacios extra', () => {
  it('desbloquear con estrella y mano vacía -> conserva cantidad de cartas', () => {
    const inputState = baseState({
      hand: null,
      starsAvailable: 2,
      starsUsed: 0,
      extra: [],
    });

    const state = applyOk(inputState, { type: 'USE_STAR_EXTRA_SLOT' });

    expect(state.extra).toHaveLength(1);
    expect(state.starsAvailable).toBe(1);
    expect(state.starsUsed).toBe(1);

    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('desbloquear sin estrella -> rechazado', () => {
    const result = applyMove(
      baseState({
        hand: null,
        starsAvailable: 0,
        starsUsed: 1,
        extra: [],
      }),
      { type: 'USE_STAR_EXTRA_SLOT' },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('no tienes estrellas disponibles');
  });

  it('desbloquear con carta en mano', () => {
    const result = applyMove(
      baseState({
        hand: 'OROS-10',
        starsAvailable: 1,
        starsUsed: 1,
        extra: [null],
      }),
      { type: 'USE_STAR_EXTRA_SLOT' },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(
      'no puedes usar estrellas con una carta en mano',
    );
  });

  it('desbloquear el segundo slot: [null] -> [null, null]', () => {
    const inputState = baseState({
      starsAvailable: 1,
      starsUsed: 1,
      extra: [null],
    });

    const state = applyOk(inputState, { type: 'USE_STAR_EXTRA_SLOT' });

    expect(state.extra).toStrictEqual([null, null]);

    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('PLACE a un espacio extra vacío -> OK', () => {
    const state = applyOk(
      baseState({
        hand: 'OROS-10',
        extra: [null],
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'extra', index: 0 },
      },
    );

    expect(state.extra).toStrictEqual(['OROS-10']);
    expect(state.hand).toBeNull();
  });

  it('PLACE a un espacio extra ocupado -> rechazado', () => {
    const result = applyMove(
      baseState({
        hand: 'OROS-10',
        extra: ['COPAS-12', null],
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'extra', index: 0 },
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it('PLACE desde el slot a cruz legal -> OK', () => {
    const inputState = baseState({
      extra: ['OROS-10'],
      cross: [[], [], ['COPAS-11'], [], []],
    });
    const state = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'extra', index: 0 },
      to: { zone: 'cross', index: 2 },
    });

    expect(state.extra[0]).toBeNull();
    expect(state.cross[2]).toEqual(['COPAS-11', 'OROS-10']);
    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('PLACE desde un espacio extra vacío -> origen vacío', () => {
    const result = applyMove(baseState({ extra: [null] }), {
      type: 'PLACE',
      from: { zone: 'extra', index: 0 },
      to: { zone: 'discard' },
    });
    expect(result.ok).toBe(false);
  });

  it('PLACE a un espacio extra inexistente (sin desbloquear) -> rechazado', () => {
    const state = applyMove(
      baseState({
        hand: 'OROS-7',
        extra: [],
      }),
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'extra', index: 0 },
      },
    );
    expect(state.ok).toBe(false);
  });

  it('test regresión -> descarte no cambia', () => {
    const inputState = baseState({
      extra: [null, 'OROS-10'],
      cross: [[], [], ['COPAS-11'], [], []],
      corners: {
        OROS: 9,
        COPAS: 3,
        ESPADAS: 11,
        BASTOS: 7,
      },
      discard: ['OROS-12', 'COPAS-4', 'BASTOS-9'],
    });
    const state = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'extra', index: 1 },
      to: { zone: 'corner', suit: 'OROS' },
    });

    expect(state.discard).toStrictEqual(['OROS-12', 'COPAS-4', 'BASTOS-9']);
    expect(countCards(state)).toBe(countCards(inputState));
  });
});

describe('Bonus -> recuperar carta', () => {
  it('OK con conservación', () => {
    const inputState = baseState({
      starsAvailable: 1,
      discard: ['OROS-12', 'COPAS-4', 'BASTOS-9'],
    });
    const state = applyOk(inputState, {
      type: 'USE_STAR_RECOVER',
      cardId: 'COPAS-4',
    });

    expect(state.hand).toBe('COPAS-4');
    expect(state.discard).toStrictEqual(['OROS-12', 'BASTOS-9']);
    expect(state.starsAvailable).toBe(0);
    expect(state.starsUsed).toBe(1);

    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('sin estrellas -> rechazado', () => {
    const result = applyMove(
      baseState({
        starsAvailable: 0,
        discard: ['OROS-12', 'COPAS-4', 'BASTOS-9'],
      }),
      {
        type: 'USE_STAR_RECOVER',
        cardId: 'COPAS-4',
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('no tienes estrellas disponibles');
  });

  it('con carta en mano -> rechazado', () => {
    const result = applyMove(
      baseState({
        starsAvailable: 1,
        hand: 'ESPADAS-3',
        discard: ['OROS-12', 'COPAS-4', 'BASTOS-9'],
      }),
      {
        type: 'USE_STAR_RECOVER',
        cardId: 'COPAS-4',
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(
      'no puedes usar estrellas con una carta en mano',
    );
  });

  it('carta que no está en el descarte -> rechazado', () => {
    const result = applyMove(
      baseState({
        starsAvailable: 1,
        discard: ['OROS-12', 'COPAS-4', 'BASTOS-9'],
      }),
      {
        type: 'USE_STAR_RECOVER',
        cardId: 'COPAS-7',
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('esa carta no está en el descarte');
  });

  it('descarte vacío -> rechazado', () => {
    const result = applyMove(
      baseState({
        starsAvailable: 1,
        discard: [],
      }),
      {
        type: 'USE_STAR_RECOVER',
        cardId: 'COPAS-7',
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('esa carta no está en el descarte');
  });

  it('mala jugada -> recuperar carta para descarte', () => {
    const inputState = baseState({
      starsAvailable: 1,
      cross: [
        ['BASTOS-6'],
        ['ESPADAS-4'],
        ['COPAS-10'],
        ['ESPADAS-3'],
        ['ESPADAS-10'],
      ],
      discard: ['OROS-5', 'ESPADAS-11', 'BASTOS-7'],
    });

    const recovered = applyOk(inputState, {
      type: 'USE_STAR_RECOVER',
      cardId: 'ESPADAS-11',
    });

    expect(legalMoves(recovered)).toStrictEqual([
      {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'discard' },
      },
    ]);

    const state = applyOk(recovered, {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'discard' },
    });

    expect(state.hand).toBeNull();
    expect(state.discard).toStrictEqual(['OROS-5', 'BASTOS-7', 'ESPADAS-11']);

    expect(countCards(state)).toBe(countCards(inputState));
  });
});

describe('Bonus: movimiento en bloque', () => {
  it('Bloque legal a pila -> OK', () => {
    const inputState = baseState({
      cross: [
        ['OROS-9', 'BASTOS-8', 'COPAS-7', 'OROS-6', 'COPAS-5', 'BASTOS-4'],
        ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
        [],
        [],
        [],
      ],
      stairwayUnlocked: true,
    });

    const state = applyOk(inputState, {
      type: 'MOVE_STACK',
      fromPile: 0,
      cardIndex: 1,
      toPile: 1,
    });

    expect(state.cross).toStrictEqual([
      ['OROS-9'],
      [
        'COPAS-12',
        'ESPADAS-11',
        'OROS-10',
        'COPAS-9',
        'BASTOS-8',
        'COPAS-7',
        'OROS-6',
        'COPAS-5',
        'BASTOS-4',
      ],
      [],
      [],
      [],
    ]);

    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('Bloque legal a hueco -> OK', () => {
    const inputState = baseState({
      cross: [
        ['OROS-9', 'BASTOS-8', 'COPAS-7', 'OROS-6', 'COPAS-5', 'BASTOS-4'],
        ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
        [],
        [],
        [],
      ],
      stairwayUnlocked: true,
    });

    const state = applyOk(inputState, {
      type: 'MOVE_STACK',
      fromPile: 0,
      cardIndex: 3,
      toPile: 4,
    });

    expect(state.cross).toStrictEqual([
      ['OROS-9', 'BASTOS-8', 'COPAS-7'],
      ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
      [],
      [],
      ['OROS-6', 'COPAS-5', 'BASTOS-4'],
    ]);

    expect(countCards(state)).toBe(countCards(inputState));
  });

  it('Sin logro -> rechazado', () => {
    const result = applyMove(
      baseState({
        cross: [
          ['OROS-9', 'BASTOS-8', 'COPAS-7', 'OROS-6', 'COPAS-5', 'BASTOS-4'],
          ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
          [],
          [],
          [],
        ],
        stairwayUnlocked: false,
      }),
      {
        type: 'MOVE_STACK',
        fromPile: 0,
        cardIndex: 1,
        toPile: 1,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('no has desbloqueado el movimiento en bloque');
  });

  it('Con carta en mano -> rechazado', () => {
    const result = applyMove(
      baseState({
        cross: [
          ['OROS-9', 'BASTOS-8', 'COPAS-7', 'OROS-6', 'COPAS-5', 'BASTOS-4'],
          ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
          [],
          [],
          [],
        ],
        stairwayUnlocked: true,
        hand: 'OROS-7',
      }),
      {
        type: 'MOVE_STACK',
        fromPile: 0,
        cardIndex: 1,
        toPile: 1,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('tienes una carta en mano');
  });

  it('Base incolocable en destino -> rechazado', () => {
    const result = applyMove(
      baseState({
        cross: [
          ['OROS-9', 'BASTOS-8', 'COPAS-7', 'OROS-6', 'COPAS-5', 'BASTOS-4'],
          ['COPAS-12', 'ESPADAS-11', 'OROS-10'],
          [],
          [],
          [],
        ],
        stairwayUnlocked: true,
      }),
      {
        type: 'MOVE_STACK',
        fromPile: 0,
        cardIndex: 0,
        toPile: 1,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('movimiento ilegal');
  });

  it.each([
    [
      'cardIndex fuera de rango (inferior)',
      0,
      -3,
      1,
      'no hay carta en esa posición',
    ],
    [
      'cardIndex fuera de rango (superior)',
      0,
      4,
      1,
      'no hay carta en esa posición',
    ],
    ['índice de pila inexistente', 0, 1, 5, 'pila inválida'],
    ['Mismo destino y origen', 0, 2, 0, 'origen y destino son la misma pila'],
  ])('%s -> rechazado', (_n, fromPile, cardIndex, toPile, errMsg) => {
    const result = applyMove(
      baseState({
        cross: [['OROS-12', 'COPAS-11', 'BASTOS-10'], [], [], [], []],
        stairwayUnlocked: true,
      }),
      {
        type: 'MOVE_STACK',
        fromPile,
        cardIndex,
        toPile,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(errMsg);
  });

  it('Bloque de 1 carta -> funciona como un PLACE', () => {
    const inputState = baseState({
      cross: [
        ['OROS-9', 'BASTOS-8'],
        ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9'],
        [],
        [],
        [],
      ],
      stairwayUnlocked: true,
    });

    const state = applyOk(inputState, {
      type: 'MOVE_STACK',
      fromPile: 0,
      cardIndex: 1,
      toPile: 1,
    });

    expect(state.cross).toStrictEqual([
      ['OROS-9'],
      ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'COPAS-9', 'BASTOS-8'],
      [],
      [],
      [],
    ]);

    expect(countCards(state)).toBe(countCards(inputState));
  });
});
