import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';
import * as api from '../api/client';
import { makeProfile } from '../test/factories';

vi.mock('../api/client');

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

function renderGuarder(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<h1>Contenido secreto</h1>} />
          </Route>
          <Route path="/login" element={<h1>Pantalla de login</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('sin sesión redirige a /login', async () => {
    renderGuarder('/secret'); //sin sesión
    expect(
      await screen.findByRole('heading', { name: 'Pantalla de login' }),
    ).toBeInTheDocument();
  });

  it('con sesión válida renderiza el contenido protegido', async () => {
    sessionStorage.setItem('baraja_token', 'tok');
    vi.mocked(api.getProfile).mockResolvedValue(makeProfile());

    renderGuarder('/secret'); // con sesión
    expect(
      await screen.findByRole('heading', { name: 'Contenido secreto' }),
    ).toBeInTheDocument();
  });
});
