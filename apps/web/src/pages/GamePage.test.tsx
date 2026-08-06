import { renderWithProviders, screen, userEvent } from '../test/utils';
import { GamePage } from './GamePage';
import * as api from '../api/client';
import { makeProfile, makeMatchView } from '../test/factories';

vi.mock('../api/client');

vi.mock('../components/Countdown', () => ({
  Countdown: ({ onDone }: { onDone: () => void }) => (
    <button onClick={onDone}>cuenta-atras-lista</button>
  ),
}));

beforeEach(() => {
  sessionStorage.setItem('baraja_token', 'tok');
  vi.mocked(api.getProfile).mockResolvedValue(makeProfile()); // rehidrata la sesión
});
afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('GamePage', () => {
  it('reanuda la partida activa al entrar', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(makeMatchView());
    renderWithProviders(<GamePage />, { route: '/play' });
    expect(await screen.findByText('50')).toBeInTheDocument(); // el tablero (conteo del robo)
  });

  it('sin partida activa muestra "Nueva partida"', async () => {
    vi.mocked(api.getActiveMatch).mockRejectedValue(new api.ApiError(404));
    renderWithProviders(<GamePage />, { route: '/play' });
    expect(
      await screen.findByRole('button', { name: /nueva partida/i }),
    ).toBeInTheDocument();
  });
});

describe('GamePage · orquestación', () => {
  it('dos clics (origen -> destino) envían PLACE con expectedVersion', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          cross: [['OROS-5'], [], [], [], []],
          corners: { OROS: 4, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: '5 de oros' })); // origen cross[0]
    await user.click(screen.getByRole('img', { name: '4 de oros' })); // destino esquina OROS

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: {
        type: 'PLACE',
        from: { zone: 'cross', index: 0 },
        to: { zone: 'corner', suit: 'OROS' },
      },
    });
  });

  it('con carta en mano, un clic coloca (PLACE desde la mano)', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'ESPADAS-2',
          corners: { OROS: 3, COPAS: 0, ESPADAS: 1, BASTOS: 0 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: 'As de espadas' }));

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'corner', suit: 'ESPADAS' },
      },
    });
  });

  it('pulsar el mazo envía DRAW', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(makeMatchView());
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('button', { name: '50' }));

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: { type: 'DRAW' },
    });
  });

  it('abandonar pide confirmación y envía ABANDON', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(makeMatchView());
    vi.mocked(api.applyMove).mockResolvedValue(
      makeMatchView({
        status: 'ABANDONED',
        finishedAt: '2026-01-01T00:01:00.000Z',
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('button', { name: 'Abandonar' }));
    await user.click(screen.getByRole('button', { name: 'Abandonar' }));

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: { type: 'ABANDON' },
    });
  });

  it('abandonar -> "No" cancela sin enviar nada', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('button', { name: 'Abandonar' }));
    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(
      screen.getByRole('button', { name: 'Abandonar' }),
    ).toBeInTheDocument();
    expect(api.applyMove).not.toHaveBeenCalled();
  });

  it('un movimiento inválido (400) muestra el mensaje del backend', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'ESPADAS-1',
          corners: { OROS: 3, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockRejectedValue(
      new api.ApiError(400, 'Movimiento inválido'),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: '3 de oros' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Movimiento inválido',
    );
  });

  it('al ganar muestra victoria con estrellas y tiempo, y permite reiniciar', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'ESPADAS-12',
          corners: { OROS: 12, COPAS: 12, ESPADAS: 11, BASTOS: 12 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(
      makeMatchView({
        status: 'WON',
        stars: 2,
        finishedAt: '2026-01-01T00:02:05.000Z', // 125s -> "2:05"
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('img', { name: 'Caballo de espadas' }),
    );

    expect(await screen.findByText('¡Victoria!')).toBeInTheDocument();
    expect(screen.getByLabelText('2 estrellas')).toBeInTheDocument();
    expect(screen.getByText('Tiempo: 2:05')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /jugar otra vez/i }));
    expect(
      screen.getByRole('button', { name: 'cuenta-atras-lista' }),
    ).toBeInTheDocument(); // arranca la cuenta atrás
  });

  it('la pastilla despliega el descarte en un overlay y se cierra', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({ view: { discard: ['OROS-11', 'COPAS-3', 'BASTOS-8'] } }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await screen.findByRole('button', { name: 'Ver 3 cartas' });
    // el fondo de la pila no se ve en el tablero (solo el tope "8 de bastos")
    expect(screen.queryByRole('img', { name: 'Caballo de oros' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Ver 3 cartas' }));
    expect(
      screen.getByRole('img', { name: 'Caballo de oros' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('img', { name: 'Caballo de oros' })).toBeNull();
  });

  it('Nueva partida: la cuenta atrás termina creando la partida', async () => {
    vi.mocked(api.getActiveMatch).mockRejectedValue(new api.ApiError(404));
    vi.mocked(api.createMatch).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('button', { name: /nueva partida/i }),
    );
    expect(api.createMatch).not.toHaveBeenCalled(); // cuenta atrás

    // mock que simula el fin de la cuenta atrás
    await user.click(
      screen.getByRole('button', { name: 'cuenta-atras-lista' }),
    );

    expect(api.createMatch).toHaveBeenCalledWith('tok');
    expect(screen.getByText('50')).toBeInTheDocument(); // tablero nuevo
  });
});

describe('GamePage · bonus', () => {
  it('espacio extra envía USE_STAR_EXTRA_SLOT', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({ view: { starsAvailable: 1 } }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('button', { name: 'Espacio extra' }),
    );

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: { type: 'USE_STAR_EXTRA_SLOT' },
    });
  });

  it('recuperar del descarte envía USE_STAR_RECOVER con la carta elegida', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: { starsAvailable: 1, discard: ['OROS-7', 'COPAS-2'] },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('button', { name: 'Recuperar del descarte' }),
    );
    await user.click(screen.getByRole('img', { name: '7 de oros' })); // carta del fondo

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: { type: 'USE_STAR_RECOVER', cardId: 'OROS-7' },
    });
  });

  it('recuperar: "Cerrar" cierra el overlay sin enviar nada', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: { starsAvailable: 1, discard: ['OROS-7', 'COPAS-2'] },
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('button', { name: 'Recuperar del descarte' }),
    );
    expect(screen.getByRole('img', { name: '7 de oros' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('img', { name: '7 de oros' })).toBeNull();
    expect(api.applyMove).not.toHaveBeenCalled();
  });

  it('movimiento en bloque: carta interior + cruz destino envía MOVE_STACK', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          stairwayUnlocked: true,
          cross: [['OROS-4', 'COPAS-3'], ['ESPADAS-5'], [], [], []],
        },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(makeMatchView());

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(
      await screen.findByRole('button', { name: 'Ver 2 cartas' }),
    );
    await user.click(screen.getByRole('img', { name: '4 de oros' })); // interior de la cruz 0
    await user.click(screen.getByRole('img', { name: '5 de espadas' })); // cruz 1 destino

    expect(api.applyMove).toHaveBeenCalledWith('tok', 'm1', {
      expectedVersion: 0,
      move: { type: 'MOVE_STACK', fromPile: 0, cardIndex: 0, toPile: 1 },
    });
  });

  it('desbloquear la escalera muestra el toast del logro', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'OROS-8',
          stairwayUnlocked: false,
          cross: [
            ['COPAS-12', 'ESPADAS-11', 'OROS-10', 'BASTOS-9'],
            [],
            [],
            [],
            [],
          ],
        },
      }),
    );
    vi.mocked(api.applyMove).mockResolvedValue(
      makeMatchView({ view: { stairwayUnlocked: true } }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: '9 de bastos' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Escalera mecánica',
    );
  });

  it.each([
    [409, 'La partida cambió, actualiza la página'],
    [404, 'Partida no encontrada'],
  ])('un error %i muestra el mensaje mapeado', async (status, message) => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'OROS-9',
          corners: { OROS: 8, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockRejectedValue(new api.ApiError(status));

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: '8 de oros' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('un error no-API muestra el mensaje genérico', async () => {
    vi.mocked(api.getActiveMatch).mockResolvedValue(
      makeMatchView({
        view: {
          hand: 'OROS-9',
          corners: { OROS: 8, COPAS: 0, ESPADAS: 0, BASTOS: 0 },
        },
      }),
    );
    vi.mocked(api.applyMove).mockRejectedValue(new Error('boom')); // no es ApiError

    const user = userEvent.setup();
    renderWithProviders(<GamePage />, { route: '/play' });

    await user.click(await screen.findByRole('img', { name: '8 de oros' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo aplicar el movimiento',
    );
  });
});
