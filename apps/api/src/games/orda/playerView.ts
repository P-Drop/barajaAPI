import type { GameState } from './types.js';

export type PlayerView = Omit<GameState, 'stock'> & {
  stock: { count: number };
};

export const toPlayerView = (state: GameState): PlayerView => {
  const { stock, ...rest } = state;
  return { ...rest, stock: { count: stock.length } };
};
