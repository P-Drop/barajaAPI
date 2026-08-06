import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RankingPage } from './RankingPage';
import * as api from '../api/client';

const h = vi.hoisted(() => ({ navigate: vi.fn(), locationKey: 'default' }));

vi.mock('../api/client');
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => h.navigate,
    useLocation: () => ({ key: h.locationKey }),
  };
});

const page = (over = {}) => ({
  total: 3,
  limit: 20,
  offset: 0,
  entries: [
    { nickname: 'Ana', avatar: 'a.webp', stars: 30, totalPlaySeconds: 3661 },
    { nickname: 'Bea', avatar: 'b.webp', stars: 20, totalPlaySeconds: 120 },
    { nickname: 'Caj', avatar: 'c.webp', stars: 10, totalPlaySeconds: 45 },
  ],
  ...over,
});

afterEach(() => {
  vi.clearAllMocks();
  h.locationKey = 'default';
});

describe('RankingPage', () => {
  it('renderiza entradas con posición, estrellas y tiempo', async () => {
    vi.mocked(api.getRanking).mockResolvedValue(page());
    render(<RankingPage />);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('⭐ 30')).toBeInTheDocument();
    expect(screen.getByText('1h 1m')).toBeInTheDocument(); // 3661s
    expect(screen.getByText('45s')).toBeInTheDocument(); // 45s
    expect(api.getRanking).toHaveBeenCalledWith(20, 0);
  });

  it('estado vacío', async () => {
    vi.mocked(api.getRanking).mockResolvedValue(
      page({ total: 0, entries: [] }),
    );
    render(<RankingPage />);
    expect(await screen.findByText(/no hay jugadores/i)).toBeInTheDocument();
  });

  it('error de carga', async () => {
    vi.mocked(api.getRanking).mockRejectedValue(new api.ApiError(500));
    render(<RankingPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el ranking',
    );
  });

  it('"Siguiente" pide la página siguiente (offset 20)', async () => {
    vi.mocked(api.getRanking)
      .mockResolvedValueOnce(page({ total: 25 }))
      .mockResolvedValueOnce(
        page({
          total: 25,
          offset: 20,
          entries: [
            {
              nickname: 'Zoe',
              avatar: 'z.webp',
              stars: 1,
              totalPlaySeconds: 10,
            },
          ],
        }),
      );
    const user = userEvent.setup();
    render(<RankingPage />);
    await screen.findByText('Ana');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Zoe')).toBeInTheDocument();
    expect(api.getRanking).toHaveBeenLastCalledWith(20, 20);
  });

  it('"Anterior" deshabilitado en la primera página', async () => {
    vi.mocked(api.getRanking).mockResolvedValue(page({ total: 25 }));
    render(<RankingPage />);
    await screen.findByText('Ana');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('"Anterior" vuelve a la página previa (offset 0)', async () => {
    vi.mocked(api.getRanking)
      .mockResolvedValueOnce(page({ total: 25 }))
      .mockResolvedValueOnce(
        page({
          total: 25,
          offset: 20,
          entries: [
            {
              nickname: 'Zoe',
              avatar: 'z.webp',
              stars: 1,
              totalPlaySeconds: 10,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(page({ total: 25 }));
    const user = userEvent.setup();
    render(<RankingPage />);
    await screen.findByText('Ana');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Zoe');
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(api.getRanking).toHaveBeenLastCalledWith(20, 0);
  });

  it('"Volver" sin historial navega al index', async () => {
    h.locationKey = 'default';
    vi.mocked(api.getRanking).mockResolvedValue(page());
    const user = userEvent.setup();
    render(<RankingPage />);
    await screen.findByText('Ana');
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(h.navigate).toHaveBeenCalledWith('/');
  });

  it('"Volver" con historial retrocede', async () => {
    h.locationKey = 'k123';
    vi.mocked(api.getRanking).mockResolvedValue(page());
    const user = userEvent.setup();
    render(<RankingPage />);
    await screen.findByText('Ana');
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(h.navigate).toHaveBeenCalledWith(-1);
  });
});
