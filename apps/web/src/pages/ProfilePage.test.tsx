import { renderWithProviders, screen } from '../test/utils';
import App from '../App';
import * as api from '../api/client';
import { makeProfile } from '../test/factories';

vi.mock('../api/client');

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('ProfilePage', () => {
  it('muestra nickname, estrellas, tiempo y logros', async () => {
    sessionStorage.setItem('baraja_token', 'tok');
    vi.mocked(api.getProfile).mockResolvedValue(
      makeProfile({
        nickname: 'Ricou',
        stars: 7,
        totalPlaySeconds: 3661,
        achievements: ['ESCALERA_MECANICA'],
      }),
    );

    renderWithProviders(<App />, { route: '/profile' });

    expect(
      await screen.findByRole('heading', { name: 'Ricou' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/7 estrellas/)).toBeInTheDocument();
    expect(screen.getByText(/1h 1m/)).toBeInTheDocument(); // 3661 -> 1h 1m (1s)
    expect(
      screen.getByRole('img', { name: 'Escalera mecánica' }),
    ).toBeInTheDocument();
  });
});
