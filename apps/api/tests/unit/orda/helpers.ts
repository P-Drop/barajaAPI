import type { GameState } from '../../../src/games/orda/types.js';

export const countCards = (state: GameState): number => {
  const crossCards = state.cross.reduce((sum, pile) => sum + pile.length, 0);
  const cornerCards = Object.values(state.corners).reduce(
    (sum, top) => sum + top,
    0,
  );
  const handCard = state.hand ? 1 : 0;

  return (
    crossCards +
    state.stock.length +
    state.discard.length +
    cornerCards +
    handCard +
    state.starsAvailable +
    state.starsUsed
  );
};

export const baseState = (over: Partial<GameState> = {}): GameState => ({
  schemaVersion: 1,
  cross: [[], [], [], [], []],
  corners: { OROS: 0, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
  stock: [],
  discard: [],
  hand: null,
  round: 0,
  starsAvailable: 0,
  starsUsed: 0,
  moveCount: 0,
  status: 'IN_PROGRESS',
  ...over,
});
