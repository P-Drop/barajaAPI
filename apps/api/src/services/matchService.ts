import type { MatchStatus } from '../generated/prisma/enums.js';
import type { GameState, Move } from '../games/orda/types.js';
import { toPlayerView, type PlayerView } from '../games/orda/playerView.js';
import { userRepository } from '../repositories/userRepository.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { createGame } from '../games/orda/deck.js';
import { toAchievements } from '../games/orda/achievements.js';
import { matchRepository } from '../repositories/matchRepository.js';
import { env } from '../config/env.js';
import { applyMove } from '../games/orda/applyMove.js';
import { ConflictError } from '../errors/ConflictError.js';
import { DomainError } from '../errors/DomainError.js';
import { computeStars } from '../games/orda/scoring.js';

export type MatchView = {
  id: string;
  version: number;
  status: MatchStatus;
  stars: number;
  moveCount: number;
  startedAt: Date;
  lastMoveAt: Date;
  finishedAt: Date | null;
  view: PlayerView;
};

const toMatchView = (
  match: {
    id: string;
    version: number;
    status: MatchStatus;
    stars: number;
    moveCount: number;
    startedAt: Date;
    lastMoveAt: Date;
    finishedAt: Date | null;
  },
  state: GameState,
): MatchView => ({
  id: match.id,
  version: match.version,
  status: match.status,
  stars: match.stars,
  moveCount: match.moveCount,
  startedAt: match.startedAt,
  lastMoveAt: match.lastMoveAt,
  finishedAt: match.finishedAt,
  view: toPlayerView(state),
});

const TTL_MS = env.MATCH_TTL_MINUTES * 60_000;

const isStale = (
  match: { status: MatchStatus; lastMoveAt: Date },
  now: Date,
): boolean => {
  return (
    match.status === 'IN_PROGRESS' &&
    now.getTime() - match.lastMoveAt.getTime() > TTL_MS
  );
};

const readState = (raw: unknown): GameState => {
  const state = raw as GameState;
  if (state.schemaVersion !== 1) {
    throw new Error(`schemaVersion no soportada: ${state.schemaVersion}`);
  }
  return state;
};

const expire = async (
  match: { id: string; version: number; startedAt: Date; lastMoveAt: Date },
  state: GameState,
  userId: string,
): Promise<MatchView> => {
  const result = applyMove(state, { type: 'ABANDON' });
  if (!result.ok) throw new Error('ABANDON inesperadamente ilegal');
  const next = result.state;

  const finishedAt = new Date(match.lastMoveAt.getTime() + TTL_MS);

  // TIEMPO JUGADO = actividad real (start -> última jugada, sin TTL)
  const playSeconds = Math.floor(
    (match.lastMoveAt.getTime() - match.startedAt.getTime()) / 1000,
  );

  const data = {
    state: next,
    status: 'ABANDONED' as MatchStatus,
    stars: 0,
    moveCount: next.moveCount,
    lastMoveAt: match.lastMoveAt,
    finishedAt,
  };

  const count = await matchRepository.consolidateFinish(
    match.id,
    userId,
    match.version,
    data,
    {
      stars: 0,
      playSeconds,
      unlockStairway: next.stairwayUnlocked,
    },
  );
  if (count === 0) {
    const fresh = await matchRepository.findByIdForUser(match.id, userId);
    return toMatchView(fresh!, readState(fresh!.state));
  }

  return toMatchView(
    {
      id: match.id,
      version: match.version + 1,
      status: 'ABANDONED',
      stars: 0,
      moveCount: next.moveCount,
      startedAt: match.startedAt,
      lastMoveAt: match.lastMoveAt,
      finishedAt,
    },
    next,
  );
};

export const matchService = {
  createMatch: async (userId: string, now: Date): Promise<MatchView> => {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const active = await matchRepository.findActiveByUser(userId);
    if (active) {
      if (isStale(active, now)) {
        await expire(active, readState(active.state), userId);
      } else {
        throw new ConflictError('Ya tienes una partida en curso');
      }
    }

    const state = createGame(Math.random, toAchievements(user.achievements));
    const match = await matchRepository.create(userId, state);

    return toMatchView(match, state);
  },

  getMatch: async (
    userId: string,
    matchId: string,
    now: Date,
  ): Promise<MatchView> => {
    const match = await matchRepository.findByIdForUser(matchId, userId);
    if (!match) throw new NotFoundError();

    const state = readState(match.state);

    if (isStale(match, now)) return expire(match, state, userId);

    return toMatchView(match, state);
  },

  applyMoveToMatch: async (
    userId: string,
    matchId: string,
    expectedVersion: number,
    move: Move,
    now: Date,
  ): Promise<MatchView> => {
    // 1. Cargar (anti-IDOR -> 404)
    const match = await matchRepository.findByIdForUser(matchId, userId);
    if (!match) throw new NotFoundError();

    const state = readState(match.state);

    // 2. TTL: si caducó, se consolida y el movimiento es moot
    if (isStale(match, now)) {
      await expire(match, state, userId);
      throw new ConflictError('La partida ha expirado por inactividad');
    }

    // 3. Pre-chequeo optimista (fail-fast amable)
    if (match.version !== expectedVersion) {
      throw new ConflictError('La partida cambió; recarga y reintenta');
    }

    // 4. El motor decide (server-authoritative)
    const result = applyMove(state, move);
    if (!result.ok) throw new DomainError(result.reason); // 400
    const next = result.state;

    // 5. Desnormalizar columnas
    const status: MatchStatus =
      move.type === 'ABANDON' ? 'ABANDONED' : next.status;
    const finished = status !== 'IN_PROGRESS';
    const elapsedSeconds = Math.floor(
      (now.getTime() - match.startedAt.getTime()) / 1000,
    );
    const stars = finished
      ? computeStars(status === 'WON', next.starsUsed, elapsedSeconds)
      : 0;
    const finishedAt = finished ? now : null;

    const data = {
      state: next,
      status,
      stars,
      moveCount: next.moveCount,
      lastMoveAt: now,
      finishedAt,
    };

    // 6. Escritura atómica con guard de versión
    // Transacción para terminar la partida
    let count: number;
    if (finished) {
      count = await matchRepository.consolidateFinish(
        matchId,
        userId,
        expectedVersion,
        data,
        {
          stars,
          playSeconds: elapsedSeconds,
          unlockStairway: next.stairwayUnlocked,
        },
      );
    } else {
      count = await matchRepository.updateWithVersion(
        matchId,
        userId,
        expectedVersion,
        data,
      );
    }
    if (count === 0)
      throw new ConflictError('La partida cambió; recarga y reintenta');

    // 7. Responder con la vista nueva
    return toMatchView(
      {
        id: matchId,
        version: expectedVersion + 1,
        status,
        stars,
        moveCount: next.moveCount,
        startedAt: match.startedAt,
        lastMoveAt: now,
        finishedAt,
      },
      next,
    );
  },
};
