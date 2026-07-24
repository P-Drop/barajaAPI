import type { Achievements } from './types.js';

export const STAIRWAY = 'ESCALERA_MECANICA';

export const toAchievements = (unlocked: string[]): Achievements => ({
  stairway: unlocked.includes(STAIRWAY),
});
