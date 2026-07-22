import { describe, it, expect } from 'vitest';
import { computeStars } from '../../../src/games/orda/scoring.js';

describe('Scoring', () => {
  it.each([
    // partida ganada, estrellas usadas, tiempo, puntuación
    [false, 0, 100, 0],
    [false, 2, 100, 0],
    [true, 2, 100, 1],
    [true, 1, 700, 2],
    [true, 1, 500, 3],
    [true, 0, 400, 4],
    [true, 0, 100, 5],
  ])('won=%s stars=%i t=%is -> %i estrellas', (won, used, secs, expected) => {
    expect(computeStars(won, used, secs)).toBe(expected);
  });

  it.each([
    [600, 2],
    [599, 3],
    [300, 4],
    [299, 5],
  ])('borde de tiempo %is -> %i estrellas', (secs, expected) => {
    const used = secs > 300 ? 1 : 0;
    expect(computeStars(true, used, secs)).toBe(expected);
  });
});
