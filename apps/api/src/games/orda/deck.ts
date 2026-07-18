import { type Card, type Suit, type GameState, SUITS } from './types.js';
import { isJoker } from './card.js';

export type Rng = () => number;

export const VALUES = Array.from({ length: 12 }, (_, i) => i + 1);

export const makeCard = (suit: Suit, value: number): Card => `${suit}-${value}`;

export const buildDeck = (): Card[] => [
  ...SUITS.flatMap((suit) => VALUES.map((value) => makeCard(suit, value))),
  'JOKER-1',
  'JOKER-2',
];

export const shuffle = (cards: readonly Card[], rng: Rng): Card[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const dealGame = (deck: Card[]): GameState => {
  const cross: Card[][] = [];
  const corners = {
    OROS: 0,
    COPAS: 0,
    ESPADAS: 0,
    BASTOS: 0,
  };
  const stock = deck.slice(5);
  let starsAvailable = 0;

  for (let i = 0; i < 5; i++) {
    if (isJoker(deck[i])) {
      cross.push([]);
      starsAvailable += 1;
      continue;
    }
    cross.push([deck[i]]);
  }

  return {
    schemaVersion: 1,
    cross,
    corners,
    stock,
    discard: [],
    hand: null,
    round: 0,
    starsAvailable,
    starsUsed: 0,
    moveCount: 0,
    status: 'IN_PROGRESS',
  };
};

export const createGame = (rng: Rng = Math.random): GameState => {
  return dealGame(shuffle(buildDeck(), rng));
};
