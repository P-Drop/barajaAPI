import { describe, it, expect } from 'vitest';
import { toPlayerView } from '../../../src/games/orda/playerView.js';
import { baseState } from './helpers.js';

describe('PlayerView (proyección de GameState)', () => {
  it('stock muestra count: N, con carta en mano y descarte intactos', () => {
    const proyection = toPlayerView(
      baseState({
        stock: ['OROS-3', 'ESPADAS-11', 'COPAS-5'],
        discard: ['OROS-10', 'BASTOS-5'],
        hand: 'ESPADAS-1',
      }),
    );

    expect(proyection.stock).toStrictEqual({ count: 3 });
    expect(proyection.hand).toStrictEqual('ESPADAS-1');
    expect(proyection.discard).toStrictEqual(['OROS-10', 'BASTOS-5']);
  });
});
