import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import type { Card as CardData } from '../api/client';

const asDeOros: CardData = {
  id: 1,
  value: 1,
  suit: 'OROS',
  isJoker: false,
  name: 'As de oros',
  image: 'oros_1.png',
};

describe('Card', () => {
  it('renderiza la imagen accesible con el nombre de la carta', () => {
    render(<Card card={asDeOros} />);
    expect(screen.getByRole('img', { name: 'As de oros' })).toBeInTheDocument();
  });

  it('mapea la exensión .png del API a .webp en el src', () => {
    render(<Card card={asDeOros} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/cards/oros_1.webp',
    );
  });

  it('el comodín (sin palo ni valor) usa joker.webp', () => {
    const comodin: CardData = {
      id: 49,
      value: null,
      suit: null,
      isJoker: true,
      name: 'Comodín',
      image: 'joker.png',
    };
    render(<Card card={comodin} />);
    expect(screen.getByRole('img', { name: 'Comodín' })).toHaveAttribute(
      'src',
      '/cards/joker.webp',
    );
  });
});
