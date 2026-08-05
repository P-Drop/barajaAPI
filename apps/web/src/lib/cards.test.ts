import { describe, it, expect } from 'vitest';
import { cardFromId } from './cards';

describe('cardFromId', () => {
  it.each([
    ['OROS-1', 'oros_1.webp', 'As de oros', false],
    ['COPAS-12', 'copas_12.webp', 'Rey de copas', false],
    ['BASTOS-7', 'bastos_7.webp', '7 de bastos', false],
    ['JOKER-1', 'joker.webp', 'Comodín', true],
  ])('cardId transforma a CardData', (cardId, image, name, isJoker) => {
    const card = cardFromId(cardId);

    expect(card.image).toBe(image);
    expect(card.name).toBe(name);
    expect(card.isJoker).toBe(isJoker);
  });
});
