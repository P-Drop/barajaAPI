import { renderWithProviders, screen, userEvent } from '../test/utils';
import { RegisterPage } from './RegisterPage';
import * as api from '../api/client';
import { makeProfile } from '../test/factories';

vi.mock('../api/client'); // usa src/api/__mocks__/client.ts

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('RegisterPage', () => {
  it('registra con el avatar elegido', async () => {
    vi.mocked(api.register).mockResolvedValue(makeProfile());
    vi.mocked(api.login).mockResolvedValue({
      token: 'tok',
      user: makeProfile(),
    });
    vi.mocked(api.getProfile).mockResolvedValue(makeProfile());

    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />, { route: '/register' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'testUser');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(
      screen.getByRole('button', { name: 'Avatar 01_oros_saco.webp' }),
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(api.register).toHaveBeenCalledWith({
      nickname: 'testUser',
      password: 'secreta123',
      avatar: '01_oros_saco.webp',
    });
  });

  it('muestra el error si el nickname está en uso (409)', async () => {
    vi.mocked(api.register).mockRejectedValue(new api.ApiError(409));

    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />, { route: '/register' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'testUser');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(
      screen.getByRole('button', { name: 'Avatar 01_oros_saco.webp' }),
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /ya está en uso/i,
    );
    expect(api.login).not.toHaveBeenCalled();
  });

  it.each([
    [400, /revisa los datos/i, false],
    [429, /demasiados intentos/i, false],
    [500, /inténtalo más tarde/i, true],
  ])('error %i muestra su mensaje', async (status, msg, fallback) => {
    vi.mocked(api.register).mockRejectedValue(
      fallback ? new Error('network') : new api.ApiError(status),
    );

    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />, { route: '/register' });
    await user.type(screen.getByLabelText('Nombre de usuario'), 'testUser');
    await user.type(screen.getByLabelText('Contraseña'), 'x');
    await user.click(
      screen.getByRole('button', { name: 'Avatar 01_oros_saco.webp' }),
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(msg);
  });
});
