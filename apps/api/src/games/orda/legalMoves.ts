import type { GameState, Move, Position } from './types.js';
import { SUITS } from './types.js';
import { topCardAt, canPlaceAt } from './positions.js';

const sameZone = (a: Position | { zone: 'hand' }, b: Position): boolean => {
  if (a.zone !== b.zone) return false;
  if (a.zone === 'cross' && b.zone === 'cross') return a.index === b.index;
  if (a.zone === 'corner' && b.zone === 'corner') return a.suit === b.suit;
  return a.zone === 'discard';
};

export const legalMoves = (state: GameState): Move[] => {
  if (state.status !== 'IN_PROGRESS') return [];

  const destinations: Position[] = [
    ...state.cross.map((_, index) => ({ zone: 'cross', index }) as const),
    ...SUITS.map((suit) => ({ zone: 'corner', suit }) as const),
    { zone: 'discard' },
  ];

  // Con carta en mano -> jugar esa carta
  if (state.hand !== null) {
    const card = state.hand;
    return destinations
      .filter((to) => canPlaceAt(state, card, to))
      .map((to) => ({ type: 'PLACE', from: { zone: 'hand' }, to }));
  }

  // Mano vacía: robar + movimientos legales
  const moves: Move[] = [];
  if (state.stock.length > 0) moves.push({ type: 'DRAW' });

  const sources: Position[] = [
    ...state.cross.map((_, index) => ({ zone: 'cross', index }) as const),
    ...SUITS.map((suit) => ({ zone: 'corner', suit }) as const),
    { zone: 'discard' },
  ];

  for (const from of sources) {
    const card = topCardAt(state, from);
    if (card === null) continue;
    for (const to of destinations) {
      if (sameZone(from, to)) continue;
      if (canPlaceAt(state, card, to)) moves.push({ type: 'PLACE', from, to });
    }
  }

  return moves;
};
