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

  // Extra slots destinations
  state.extra.forEach((slot, i) => {
    if (slot === null) destinations.push({ zone: 'extra', index: i });
  });

  // Con carta en mano -> jugar esa carta
  if (state.hand !== null) {
    const card = state.hand;
    return destinations
      .filter((to) => canPlaceAt(state, card, to))
      .map((to) => ({ type: 'PLACE', from: { zone: 'hand' }, to }));
  }

  // DRAW
  const moves: Move[] = [];
  if (state.stock.length > 0) moves.push({ type: 'DRAW' });

  // PLACE
  const sources: Position[] = [
    ...state.cross.map((_, index) => ({ zone: 'cross', index }) as const),
    ...SUITS.map((suit) => ({ zone: 'corner', suit }) as const),
    { zone: 'discard' },
  ];

  // Extra slots sources
  state.extra.forEach((slot, i) => {
    if (state.extra[i]) sources.push({ zone: 'extra', index: i });
  });

  for (const from of sources) {
    const card = topCardAt(state, from);
    if (card === null) continue;
    for (const to of destinations) {
      if (sameZone(from, to)) continue;
      if (canPlaceAt(state, card, to)) moves.push({ type: 'PLACE', from, to });
    }
  }

  // STARS
  if (state.starsAvailable > 0) {
    // USE_EXTRA_SLOT
    moves.push({ type: 'USE_STAR_EXTRA_SLOT' });

    // USE_EXTRA_RECOVER
    for (const card of state.discard) {
      moves.push({ type: 'USE_STAR_RECOVER', cardId: card });
    }
  }

  // MOVE_STACK
  if (state.stairwayUnlocked) {
    for (let fromPile = 0; fromPile < 5; fromPile++) {
      for (let cardInd = 0; cardInd < state.cross[fromPile].length; cardInd++) {
        for (let to = 0; to < 5; to++) {
          if (
            canPlaceAt(state, state.cross[fromPile][cardInd], {
              zone: 'cross',
              index: to,
            })
          )
            moves.push({
              type: 'MOVE_STACK',
              fromPile: fromPile,
              cardIndex: cardInd,
              toPile: to,
            });
        }
      }
    }
  }

  return moves;
};
