import type { GameState, Move, MoveResult } from './types.js';
import { SUITS } from './types.js';
import { isJoker } from './card.js';
import { canPlaceAt, topCardAt } from './positions.js';

const reject = (reason: string): MoveResult => ({ ok: false, reason });

const isVictory = (s: GameState): boolean =>
  SUITS.every((suit) => s.corners[suit] === 12);

export const applyMove = (state: GameState, move: Move): MoveResult => {
  if (state.status !== 'IN_PROGRESS') return reject('la partida ha terminado');

  const next = structuredClone(state);

  switch (move.type) {
    case 'ABANDON': {
      next.status = 'LOST';
      next.moveCount += 1;
      return { ok: true, state: next };
    }

    case 'DRAW': {
      if (next.hand !== null) return reject('hay una carta en la mano');
      if (next.stock.length === 0) return reject('no quedan cartas para robar');

      const card = next.stock.pop()!; // top del mazo (seguro con el guard)
      next.round += 1;

      if (isJoker(card)) {
        next.starsAvailable += 1; // comodín -> estrella
      } else {
        next.hand = card; // carta -> mano
      }
      next.moveCount += 1;
      return { ok: true, state: next };
    }

    case 'PLACE': {
      const { from, to } = move;

      // (1) Bloqueo: con carta en mano, solo se puede jugar esa carta
      if (next.hand !== null && from.zone !== 'hand') {
        return reject('tienes una carta en mano: solo puedes jugar esta');
      }

      // (2) Resolver la carta de origen (siempre la superior del montón)
      const card = topCardAt(next, from);

      if (card === null) return reject('origen vacío');

      // (3) Validar el destino con las reglas

      if (!canPlaceAt(next, card, to)) return reject('movimiento ilegal');

      // (4) Mutar: quitar de origen, poner en destino
      if (from.zone === 'hand') next.hand = null;
      else if (from.zone === 'cross') next.cross[from.index].pop();
      else if (from.zone === 'corner') next.corners[from.suit] -= 1;
      else next.discard.pop();

      if (to.zone === 'cross') next.cross[to.index].push(card);
      else if (to.zone === 'corner') next.corners[to.suit] += 1;
      else next.discard.push(card);

      // (5) Cerrar el movimiento
      next.moveCount += 1;
      if (isVictory(next)) next.status = 'WON';
      return { ok: true, state: next };
    }
  }
};
