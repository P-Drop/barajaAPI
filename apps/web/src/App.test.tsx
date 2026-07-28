import { renderWithProviders, screen, userEvent } from './test/utils';
import App from './App';
import * as api from './api/client';
import { makeProfile } from './test/factories';

vi.mock('./api/client');

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('Flujo de login', () => {
  it('login correcto navega al pefil', async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: 'tok',
      user: makeProfile({ nickname: 'Ricou' }),
    });
    vi.mocked(api.getProfile).mockResolvedValue(
      makeProfile({ nickname: 'Ricou' }),
    );

    const user = userEvent.setup();

    renderWithProviders(<App />, { route: '/login' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'Ricou');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(
      await screen.findByRole('heading', { name: 'Ricou' }),
    ).toBeInTheDocument();
  });

  it('token caducado al rehidratar -> vuelve a login y limpia el token', async () => {
    sessionStorage.setItem('baraja_token', 'caducado');

    vi.mocked(api.getProfile).mockRejectedValue(new api.ApiError(401));

    renderWithProviders(<App />, { route: '/profile' });

    expect(
      await screen.findByLabelText('Nombre de usuario'),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem('baraja_token')).toBeNull();
  });
});
