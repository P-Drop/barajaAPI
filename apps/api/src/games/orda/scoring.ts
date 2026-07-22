export const computeStars = (
  won: boolean,
  starsUsed: number,
  elapsedSeconds: number,
): number => {
  if (!won) return 0;
  if (starsUsed >= 2) return 1;
  if (starsUsed === 1) return elapsedSeconds >= 600 ? 2 : 3;
  return elapsedSeconds >= 300 ? 4 : 5;
};
