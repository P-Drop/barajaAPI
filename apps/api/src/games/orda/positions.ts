import type { Card, GameState, Position } from './types.js';
import { makeCard } from './deck.js';
import { canPlaceOnCorner, canPlaceOnCross, canPlaceOnHole } from './rules.js';

// Carta superior en una posición, o null si está vacía
export const topCardAt = (
  state: GameState,
  pos: Position | { zone: 'hand' },
): Card | null => {
  switch (pos.zone) {
    case 'hand':
      return state.hand;

    case 'cross': {
      const pile = state.cross[pos.index];
      return pile && pile.length > 0 ? pile[pile.length - 1] : null;
    }

    case 'corner': {
      const top = state.corners[pos.suit];
      return top === 0 ? null : makeCard(pos.suit, top);
    }

    case 'discard':
      return state.discard.length > 0
        ? state.discard[state.discard.length - 1]
        : null;

    case 'extra':
      return state.extra[pos.index] ?? null;
  }
};

// ¿Es legal colocar la carta (card) en el destino (to)?
export const canPlaceAt = (
  state: GameState,
  card: Card,
  to: Position,
): boolean => {
  switch (to.zone) {
    case 'cross': {
      const pile = state.cross[to.index];
      if (!pile) return false;
      return pile.length === 0
        ? canPlaceOnHole(card)
        : canPlaceOnCross(card, pile[pile.length - 1]);
    }

    case 'corner': {
      const top = state.corners[to.suit];
      return canPlaceOnCorner(card, to.suit, top);
    }

    case 'discard':
      return true;

    case 'extra':
      return state.extra[to.index] === null;
  }
};
