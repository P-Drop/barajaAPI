import { renderWithProviders, screen } from '../test/utils';
import * as api from '../api/client';
import App from '../App';

vi.mock('../api/client');

afterEach(() => {
  vi.clearAllMocks();
});

describe('App', () => {
  it('pinta las cartas que devuelve la API', async () => {
    vi.mocked(api.getDeck).mockResolvedValue([
      {
        id: 1,
        value: 1,
        suit: 'OROS',
        isJoker: false,
        name: 'As de oros',
        image: 'oros_1.png',
      },
    ]);

    renderWithProviders(<App />, { route: '/' });

    expect(
      await screen.findByRole('img', { name: 'As de oros' }),
    ).toBeInTheDocument();
  });
});
