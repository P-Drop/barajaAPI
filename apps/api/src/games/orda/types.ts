export const SUITS = ['OROS', 'COPAS', 'ESPADAS', 'BASTOS'] as const;
export type Suit = (typeof SUITS)[number];
export type Card = string; // 'OROS-1' ... 'BASTOS-12', 'JOKER-1', 'JOKER-2'

export interface GameState {
  schemaVersion: 1;
  cross: Card[][]; // 5 pilas; [] = hueco; último elemento -> carta superior
  corners: Record<Suit, number>; // valor superior; 0 = vacía
  stock: Card[];
  discard: Card[];
  hand: Card | null;
  round: number; // 0..45
  starsAvailable: number;
  starsUsed: number;
  moveCount: number;
  status: 'IN_PROGRESS' | 'WON' | 'LOST';
}

export type Position =
  | { zone: 'cross'; index: number } // 0..4
  | { zone: 'corner'; suit: Suit }
  | { zone: 'discard' };

// En F5-5 se añade { zone: 'extra'; index }

export type Move =
  | { type: 'DRAW' }
  | { type: 'PLACE'; from: Position | { zone: 'hand' }; to: Position }
  | { type: 'ABANDON' };

export type MoveResult =
  { ok: true; state: GameState } | { ok: false; reason: string }; // service -> DomainError -> 400
