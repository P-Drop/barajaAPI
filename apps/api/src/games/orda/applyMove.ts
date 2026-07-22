import type { GameState, Move, MoveResult } from './types.js';
import { SUITS } from './types.js';
import { isJoker } from './card.js';
import { canPlaceAt, topCardAt } from './positions.js';
import { trackStairway } from './trackStairway.js';

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

      // Break stairway tracker
      trackStairway(next, move);

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
      else if (from.zone === 'discard') next.discard.pop();
      else next.extra[from.index] = null;

      if (to.zone === 'cross') next.cross[to.index].push(card);
      else if (to.zone === 'corner') next.corners[to.suit] += 1;
      else if (to.zone === 'discard') next.discard.push(card);
      else next.extra[to.index] = card;

      // (5) Stairway Tracker
      trackStairway(next, move);

      // (6) Cerrar el movimiento
      next.moveCount += 1;
      if (isVictory(next)) next.status = 'WON';
      return { ok: true, state: next };
    }

    case 'USE_STAR_EXTRA_SLOT': {
      if (next.hand !== null)
        return reject('no puedes usar estrellas con una carta en mano');
      if (next.starsAvailable === 0)
        return reject('no tienes estrellas disponibles');

      next.extra.push(null);
      next.starsAvailable -= 1;
      next.starsUsed += 1;
      next.moveCount += 1;

      // Break stairway tracker
      trackStairway(next, move);

      return { ok: true, state: next };
    }

    case 'USE_STAR_RECOVER': {
      if (next.hand !== null)
        return reject('no puedes usar estrellas con una carta en mano');
      if (next.starsAvailable === 0)
        return reject('no tienes estrellas disponibles');

      const index = next.discard.indexOf(move.cardId);
      if (index === -1) return reject('esa carta no está en el descarte');

      next.discard.splice(index, 1);
      next.hand = move.cardId;
      next.starsAvailable -= 1;
      next.starsUsed += 1;
      next.moveCount += 1;

      // Break stairway tracker
      trackStairway(next, move);

      return { ok: true, state: next };
    }

    case 'MOVE_STACK': {
      if (!next.stairwayUnlocked)
        return reject('no has desbloqueado el movimiento en bloque');
      if (next.hand !== null) return reject('tienes una carta en mano');
      if (move.fromPile === move.toPile)
        return reject('origen y destino son la misma pila');

      const source = next.cross[move.fromPile];
      const dest = next.cross[move.toPile];
      if (!source || !dest) return reject('pila inválida');
      if (move.cardIndex < 0 || move.cardIndex >= source.length)
        return reject('no hay carta en esa posición');

      const base = source[move.cardIndex];
      if (!canPlaceAt(next, base, { zone: 'cross', index: move.toPile }))
        return reject('movimiento ilegal');

      const block = source.splice(move.cardIndex);
      dest.push(...block);

      trackStairway(next, move);
      next.moveCount += 1;
      return { ok: true, state: next };
    }
  }
};
