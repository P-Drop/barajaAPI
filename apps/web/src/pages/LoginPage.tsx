import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiError } from '../api/client';

function loginError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Nickname o contraseña incorrectos';
    if (err.status === 429)
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo';
  }
  return 'No se pudo iniciar sesión. Inténtalo más tarde';
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ nickname, password });
      navigate('/profile');
    } catch (err) {
      setError(loginError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label>
        Nombre de usuario
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Entrando...' : 'Entrar'}
      </button>
      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </form>
  );
}
