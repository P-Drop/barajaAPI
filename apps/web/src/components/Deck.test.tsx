import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Deck } from './Deck';
import {
  getDeck,
  getShuffledDeck,
  ApiError,
  type Card as CardData,
} from '../api/client';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual, // conserva el ApiError real (necesario para instanceof)
    getDeck: vi.fn(),
    getShuffledDeck: vi.fn(),
  };
});

const mockGetDeck = vi.mocked(getDeck);
const mockGetShuffledDeck = vi.mocked(getShuffledDeck);

const carta = (id: number, name: string): CardData => ({
  id,
  value: id,
  suit: 'OROS',
  isJoker: false,
  name,
  image: `oros_${id}.png`,
});

describe('Deck', () => {
  // Estado 'cargando' congelado
  it('muestra el estado de carga inicial', () => {
    // Promesa que nunca resuelve
    mockGetDeck.mockReturnValue(new Promise(() => {}));
    render(<Deck />);
    expect(screen.getByText(/cargando baraja/i)).toBeInTheDocument();
  });

  it('muestra el mensaje específico de rate limit ante un 429', async () => {
    mockGetDeck.mockRejectedValue(new ApiError(429));
    render(<Deck />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /demasiadas peticiones/i,
    );
  });

  it('barajar pide la baraja barajada y re-renderiza', async () => {
    const user = userEvent.setup();
    mockGetDeck.mockResolvedValue([carta(1, 'As de oros')]);
    mockGetShuffledDeck.mockResolvedValue([carta(2, 'Dos de oros')]);
    render(<Deck />);
    await screen.findByRole('img', { name: 'As de oros' });

    await user.click(screen.getByRole('button', { name: /barajar/i }));

    expect(mockGetShuffledDeck).toHaveBeenCalledWith(false);
    expect(
      await screen.findByRole('img', { name: 'Dos de oros' }),
    ).toBeInTheDocument();
  });

  it('se renderiza la baraja completa en el estado inicial', async () => {
    mockGetDeck.mockResolvedValue([
      carta(1, 'As de oros'),
      carta(2, 'Dos de oros'),
      carta(3, 'Tres de oros'),
    ]);
    render(<Deck />);

    expect(await screen.findAllByRole('img')).toHaveLength(3);
  });

  it('se muestra mensaje de error genérico', async () => {
    mockGetDeck.mockRejectedValue(new ApiError(500));
    render(<Deck />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no se pudo cargar/i,
    );
  });

  it('muestra botón "Barajar" deshabilitado mientras se carga', async () => {
    const user = userEvent.setup();
    mockGetDeck.mockResolvedValue([carta(1, 'As de oros')]);
    mockGetShuffledDeck.mockReturnValue(new Promise(() => {}));
    render(<Deck />);
    await screen.findByRole('img', { name: 'As de oros' });

    await user.click(screen.getByRole('button', { name: /barajar/i }));

    expect(
      await screen.findByRole('button', { name: /barajar/i }),
    ).toBeDisabled();
  });

  it('Toggle 48/40 muestra la baraja de 40 (short=true) y se mantiene activado', async () => {
    const user = userEvent.setup();
    mockGetDeck.mockResolvedValue([carta(1, 'As de oros')]);
    render(<Deck />);
    await screen.findByRole('img', { name: 'As de oros' });

    await user.click(screen.getByRole('checkbox'));

    expect(mockGetDeck).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('mensaje y estado de error persiste hasta el éxito, después desaparece', async () => {
    const user = userEvent.setup();
    mockGetDeck.mockRejectedValue(new ApiError(500));
    mockGetShuffledDeck.mockResolvedValue([carta(1, 'As de oros')]);
    render(<Deck />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no se pudo cargar/i,
    );

    await user.click(await screen.findByRole('button', { name: /barajar/i }));

    expect(
      await screen.findByRole('img', { name: 'As de oros' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el error de rate limit si barajar falla con 429, sin vaciar el grid', async () => {
    const user = userEvent.setup();
    mockGetDeck.mockResolvedValue([carta(1, 'As de oros')]);
    mockGetShuffledDeck.mockRejectedValue(new ApiError(429));
    render(<Deck />);
    await screen.findByRole('img', { name: 'As de oros' });

    await user.click(screen.getByRole('button', { name: /barajar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /demasiadas peticiones/i,
    );
    expect(await screen.findByRole('img', { name: 'As de oros' }));
  });
});
