import type { Profile, MatchView, PlayerView } from '../api/client';

export function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    nickname: 'testUser',
    avatar: 'a.webp',
    stars: 0,
    totalPlaySeconds: 0,
    achievements: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

export function makeMatchView(
  over: Partial<Omit<MatchView, 'view'>> & { view?: Partial<PlayerView> } = {},
): MatchView {
  const { view, ...rest } = over;
  return {
    id: 'm1',
    version: 0,
    status: 'IN_PROGRESS',
    stars: 0,
    moveCount: 0,
    startedAt: '2026-01-01T00:00:00.000Z',
    lastMoveAt: '2026-01-01T00:00:00.000Z',
    finishedAt: null,
    ...rest,
    view: {
      schemaVersion: 1,
      cross: [[], [], [], [], []],
      corners: { OROS: 0, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
      stock: { count: 50 },
      discard: [],
      hand: null,
      round: 0,
      starsAvailable: 0,
      starsUsed: 0,
      moveCount: 0,
      status: 'IN_PROGRESS',
      extra: [],
      stairwayUnlocked: false,
      stairwayBuilding: null,
      ...view,
    },
  };
}
