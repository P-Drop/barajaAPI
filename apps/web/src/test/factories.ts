import type { Profile } from '../api/client';

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
