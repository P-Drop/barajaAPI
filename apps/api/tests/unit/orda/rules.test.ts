import { describe, it, expect } from 'vitest';
import {
  canPlaceOnCross,
  canPlaceOnCorner,
  canPlaceOnHole,
} from '../../../src/games/orda/rules.js';

describe('canPlaceOnCross', () => {
  it.each([
    ['COPAS-4', 'BASTOS-5'],
    ['ESPADAS-9', 'OROS-10'],
  ])('%s sobre %s -> legal', (card, target) => {
    expect(canPlaceOnCross(card, target)).toBe(true);
  });

  it.each([
    ['COPAS-4', 'COPAS-5'], // Mismo palo
    ['ESPADAS-9', 'ESPADAS-10'],
    ['OROS-3', 'OROS-6'], // No consecutivo
    ['BASTOS-6', 'OROS-4'], // Detino menor que carta
    ['JOKER-1', 'OROS-2'], // Comodín no jugable
  ])('%s sobre %s -> ilegal', (card, target) => {
    expect(canPlaceOnCross(card, target)).toBe(false);
  });
});

describe('canPlaceOnCorner', () => {
  it.each([
    ['OROS-1', 'OROS', 0],
    ['OROS-2', 'OROS', 1],
    ['ESPADAS-11', 'ESPADAS', 10],
  ] as const)('%s en esquina %s (top %i) -> legal', (card, suit, top) => {
    expect(canPlaceOnCorner(card, suit, top)).toBe(true);
  });

  it.each([
    ['BASTOS-6', 'BASTOS', 4], // No consecutivo
    ['OROS-2', 'COPAS', 1], // Palo distinto
    ['OROS-3', 'OROS', 1], // No consecutivo
    ['JOKER-1', 'OROS', 0], // Comodín no permitido
  ] as const)('%s en esquina %s (top %i) -> ilegal', (card, suit, top) => {
    expect(canPlaceOnCorner(card, suit, top)).toBe(false);
  });
});

describe('canPlaceOnHole', () => {
  it('una carta (no comodín) válida en un hueco', () => {
    expect(canPlaceOnHole('OROS-7')).toBe(true);
  });

  it('un comodín no válido en un hueco', () => {
    expect(canPlaceOnHole('JOKER-1')).toBe(false);
  });
});
