import type { GameState, Move } from './types.js';

export const trackStairway = (state: GameState, move: Move): void => {
  // Logro conseguido
  if (state.stairwayUnlocked) return;

  // Tracker
  if (move.type === 'PLACE') {
    const { from, to } = move;

    if (from.zone === 'cross' && to.zone === 'cross') {
      state.stairwayBuilding = { pile: to.index, count: 1 };
      return;
    }

    if (
      from.zone === 'discard' &&
      to.zone === 'cross' &&
      to.index === state.stairwayBuilding?.pile
    ) {
      state.stairwayBuilding.count += 1;
      if (state.stairwayBuilding.count >= 4) {
        state.stairwayUnlocked = true;
        state.stairwayBuilding = null;
      }
      return;
    }
  }
  // Breaker
  state.stairwayBuilding = null;
};
