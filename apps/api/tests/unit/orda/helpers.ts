import type { GameState, Move } from '../../../src/games/orda/types.js';
import { applyMove } from '../../../src/games/orda/applyMove.js';

export const countCards = (state: GameState): number => {
  const crossCards = state.cross.reduce((sum, pile) => sum + pile.length, 0);
  const cornerCards = Object.values(state.corners).reduce(
    (sum, top) => sum + top,
    0,
  );
  const handCard = state.hand ? 1 : 0;
  const extraCards = state.extra.filter((c) => c !== null).length;

  return (
    crossCards +
    state.stock.length +
    state.discard.length +
    cornerCards +
    handCard +
    state.starsAvailable +
    state.starsUsed +
    extraCards
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
  extra: [],
  stairwayUnlocked: false,
  stairwayBuilding: null,
  ...over,
});

export const applyOk = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`Movimiento ilegal inesperado: ${result.reason}`);
  }
  return result.state;
};
