import { renderWithProviders, screen, userEvent } from '../test/utils';
import { LoginPage } from './LoginPage';
import * as api from '../api/client';
import { makeProfile } from '../test/factories';

vi.mock('../api/client'); // usa src/api/__mocks__/client.ts

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('LoginPage', () => {
  it('envía credenciales al hacer login', async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: 'tok',
      user: makeProfile(),
    });
    vi.mocked(api.getProfile).mockResolvedValue(makeProfile());

    const user = userEvent.setup();

    renderWithProviders(<LoginPage />, { route: '/login' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'testUser');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(api.login).toHaveBeenCalledWith({
      nickname: 'testUser',
      password: 'secreta123',
    });
  });

  it('muestra error con credenciales inválidas (401)', async () => {
    vi.mocked(api.login).mockRejectedValue(new api.ApiError(401));

    const user = userEvent.setup();

    renderWithProviders(<LoginPage />, { route: '/login' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'testUser');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos/i);
  });
});
