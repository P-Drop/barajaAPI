import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./api/client', () => ({
  getDeck: vi.fn().mockResolvedValue([
    {
      id: 1,
      value: 1,
      suit: 'OROS',
      isJoker: false,
      name: 'As de oros',
      image: 'oros_1.png',
    },
  ]),
}));

describe('App', () => {
  it('pinta las cartas que devuelve la API', async () => {
    render(<App />);
    expect(
      await screen.findByRole('img', { name: 'As de oros' }),
    ).toBeInTheDocument();
  });
});
