import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiError } from '../api/client';

const AVATAR_OPTIONS = [
  '01_oros_saco.webp',
  '02_oros_bombon.webp',
  '03_oros_pirata.webp',
  '04_oros_buscador.webp',
  '05_copas_bebedor.webp',
  '06_copas_trofeo.webp',
  '07_copas_brindis.webp',
  '08_copas_malabarista.webp',
  '09_espadas_mosquetero.webp',
  '10_espadas_sardinas.webp',
  '11_espadas_escudo.webp',
  '12_bastos_rastafari.webp',
  '13_bastos_cavernicola.webp',
  '14_bastos_lenador.webp',
  '15_bastos_florece.webp',
  '16_oros_atardecer.webp',
  '17_espadas_esquiadora.webp',
  '18_bastos_homerun.webp',
  '19_espadas_katana.webp',
  '20_copas_jacuzzi.webp',
];

function registerError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return 'Ese nickname ya está en uso';
    if (err.status === 400) return 'Revisa los datos del formulario';
    if (err.status === 429) return 'Demasiados intentos. Espera un momento';
  }
  return 'No se pudo completar el registro. Inténtalo más tarde';
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ nickname, password, avatar });
      navigate('/profile');
    } catch (err) {
      setError(registerError(err));
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
      <fieldset>
        <legend>Elige tu avatar</legend>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_OPTIONS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              aria-pressed={avatar === a}
              className={
                avatar === a ? 'ring-2 ring-amber-500 rounded-full' : ''
              }
            >
              <img
                src={`/avatars/${a}`}
                alt={`Avatar ${a}`}
                className="rounded-full w-16 h-16"
              />
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting || !avatar}>
        Crear cuenta
      </button>
    </form>
  );
}
