import { describe, it, expect } from 'vitest';
import { suitOf, valueOf, isJoker } from '../../../src/games/orda/card.js';

describe('suitOf', () => {
  it.each([
    ['OROS-1', 'OROS'],
    ['COPAS-7', 'COPAS'],
    ['ESPADAS-10', 'ESPADAS'],
    ['BASTOS-12', 'BASTOS'],
  ])('%s -> %s', (card, expected) => {
    expect(suitOf(card)).toBe(expected);
  });

  it('un comodín no tiene palo', () => {
    expect(suitOf('JOKER-1')).toBeNull();
  });
});

describe('valueOf', () => {
  it.each([
    ['OROS-1', 1],
    ['ESPADAS-10', 10],
    ['BASTOS-12', 12],
  ])('%s -> %i', (card, expected) => {
    expect(valueOf(card)).toBe(expected);
  });
});

describe('isJoker', () => {
  it('detecta los dos comodines', () => {
    expect(isJoker('JOKER-1')).toBe(true);
    expect(isJoker('JOKER-2')).toBe(true);
  });

  it('una carta con palo no es comodín', () => {
    expect(isJoker('COPAS-3')).toBe(false);
  });
});
