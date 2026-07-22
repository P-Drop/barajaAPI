import { describe, it, expect } from 'vitest';
import { baseState, countCards, applyOk } from './helpers.js';

describe('Stairway Tracker', () => {
  it('Maniobra completa -> consigue logro', () => {
    const inputState = baseState({
      cross: [
        ['COPAS-7'],
        [],
        [],
        [],
        ['BASTOS-6', 'OROS-5', 'COPAS-4', 'ESPADAS-3'],
      ],
    });

    const firstPrepare = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(firstPrepare.stairwayUnlocked).toBe(false);
    expect(firstPrepare.stairwayBuilding).toBeNull();

    const secondPrepare = applyOk(firstPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(secondPrepare.stairwayUnlocked).toBe(false);
    expect(secondPrepare.stairwayBuilding).toBeNull();

    const thirdPrepare = applyOk(secondPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(thirdPrepare.stairwayUnlocked).toBe(false);
    expect(thirdPrepare.stairwayBuilding).toBeNull();

    const firstCard = applyOk(thirdPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'cross', index: 0 },
    });

    expect(firstCard.stairwayUnlocked).toBe(false);
    expect(firstCard.stairwayBuilding).not.toBeNull();

    const secondCard = applyOk(firstCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(secondCard.stairwayUnlocked).toBe(false);
    expect(secondCard.stairwayBuilding).not.toBeNull();

    const thirdCard = applyOk(secondCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(thirdCard.stairwayUnlocked).toBe(false);
    expect(thirdCard.stairwayBuilding).not.toBeNull();

    const completed = applyOk(thirdCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(completed.stairwayUnlocked).toBe(true);
    expect(completed.cross).toStrictEqual([
      ['COPAS-7', 'BASTOS-6', 'OROS-5', 'COPAS-4', 'ESPADAS-3'],
      [],
      [],
      [],
      [],
    ]);

    expect(countCards(completed)).toBe(countCards(inputState));
  });

  it('Maniobra incompleta (3 cartas) -> no logro', () => {
    const inputState = baseState({
      cross: [['COPAS-7'], [], [], [], ['BASTOS-6', 'OROS-5', 'COPAS-4']],
    });

    const firstPrepare = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(firstPrepare.stairwayUnlocked).toBe(false);
    expect(firstPrepare.stairwayBuilding).toBeNull();

    const secondPrepare = applyOk(firstPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(secondPrepare.stairwayUnlocked).toBe(false);
    expect(secondPrepare.stairwayBuilding).toBeNull();

    const firstCard = applyOk(secondPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'cross', index: 0 },
    });

    expect(firstCard.stairwayUnlocked).toBe(false);
    expect(firstCard.stairwayBuilding).not.toBeNull();

    const secondCard = applyOk(firstCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(secondCard.stairwayUnlocked).toBe(false);
    expect(secondCard.stairwayBuilding).not.toBeNull();

    const uncompleted = applyOk(secondCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(uncompleted.stairwayUnlocked).toBe(false);
    expect(uncompleted.cross).toStrictEqual([
      ['COPAS-7', 'BASTOS-6', 'OROS-5', 'COPAS-4'],
      [],
      [],
      [],
      [],
    ]);

    expect(countCards(uncompleted)).toBe(countCards(inputState));
  });

  it('Interrupción en la maniobra -> reinicia tracker', () => {
    const inputState = baseState({
      cross: [
        ['COPAS-7'],
        ['OROS-1'],
        [],
        [],
        ['BASTOS-6', 'OROS-5', 'COPAS-4', 'ESPADAS-3'],
      ],
    });

    const firstPrepare = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(firstPrepare.stairwayBuilding).toBeNull();
    expect(firstPrepare.stairwayUnlocked).toBe(false);

    const secondPrepare = applyOk(firstPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(secondPrepare.stairwayUnlocked).toBe(false);
    expect(secondPrepare.stairwayBuilding).toBeNull();

    const thirdPrepare = applyOk(secondPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(thirdPrepare.stairwayUnlocked).toBe(false);
    expect(thirdPrepare.stairwayBuilding).toBeNull();

    const firstCard = applyOk(thirdPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'cross', index: 0 },
    });

    expect(firstCard.stairwayUnlocked).toBe(false);
    expect(firstCard.stairwayBuilding).not.toBeNull();

    const secondCard = applyOk(firstCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(secondCard.stairwayUnlocked).toBe(false);
    expect(secondCard.stairwayBuilding).not.toBeNull();

    const thirdCard = applyOk(secondCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(thirdCard.stairwayUnlocked).toBe(false);
    expect(thirdCard.stairwayBuilding).not.toBeNull();

    const interruption = applyOk(thirdCard, {
      type: 'PLACE',
      from: { zone: 'cross', index: 1 },
      to: { zone: 'corner', suit: 'OROS' },
    });

    expect(interruption.stairwayBuilding).toBeNull();

    const completed = applyOk(interruption, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(completed.stairwayUnlocked).toBe(false);
    expect(completed.cross).toStrictEqual([
      ['COPAS-7', 'BASTOS-6', 'OROS-5', 'COPAS-4', 'ESPADAS-3'],
      [],
      [],
      [],
      [],
    ]);

    expect(countCards(completed)).toBe(countCards(inputState));
  });

  it('Robar carta -> interrupción', () => {
    const inputState = baseState({
      cross: [['COPAS-7'], [], [], [], ['BASTOS-6', 'OROS-5', 'COPAS-4']],
      stock: ['ESPADAS-3'],
    });

    const firstPrepare = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(firstPrepare.stairwayUnlocked).toBe(false);
    expect(firstPrepare.stairwayBuilding).toBeNull();

    const secondPrepare = applyOk(firstPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'discard' },
    });

    expect(secondPrepare.stairwayUnlocked).toBe(false);
    expect(secondPrepare.stairwayBuilding).toBeNull();

    const firstCard = applyOk(secondPrepare, {
      type: 'PLACE',
      from: { zone: 'cross', index: 4 },
      to: { zone: 'cross', index: 0 },
    });

    expect(firstCard.stairwayUnlocked).toBe(false);
    expect(firstCard.stairwayBuilding).not.toBeNull();

    const secondCard = applyOk(firstCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(secondCard.stairwayUnlocked).toBe(false);
    expect(secondCard.stairwayBuilding).not.toBeNull();

    const thirdCard = applyOk(secondCard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(thirdCard.stairwayBuilding).not.toBeNull();
    expect(thirdCard.stairwayUnlocked).toBe(false);

    const drawInterruption = applyOk(thirdCard, { type: 'DRAW' });

    expect(drawInterruption.stairwayBuilding).toBeNull();
    expect(drawInterruption.hand).toBe('ESPADAS-3');

    const handToDiscard = applyOk(drawInterruption, {
      type: 'PLACE',
      from: { zone: 'hand' },
      to: { zone: 'discard' },
    });

    expect(handToDiscard.stairwayBuilding).toBeNull();

    const uncompleted = applyOk(handToDiscard, {
      type: 'PLACE',
      from: { zone: 'discard' },
      to: { zone: 'cross', index: 0 },
    });

    expect(uncompleted.stairwayUnlocked).toBe(false);
    expect(uncompleted.cross).toStrictEqual([
      ['COPAS-7', 'BASTOS-6', 'OROS-5', 'COPAS-4', 'ESPADAS-3'],
      [],
      [],
      [],
      [],
    ]);

    expect(countCards(uncompleted)).toBe(countCards(inputState));
  });

  it('Logro conseguido -> tracker desactivado', () => {
    const inputState = baseState({
      stairwayUnlocked: true,
      cross: [['OROS-10'], ['BASTOS-9'], [], [], []],
    });

    const result = applyOk(inputState, {
      type: 'PLACE',
      from: { zone: 'cross', index: 1 },
      to: { zone: 'cross', index: 0 },
    });

    expect(result.stairwayBuilding).toBeNull();

    expect(countCards(result)).toBe(countCards(inputState));
  });
});
