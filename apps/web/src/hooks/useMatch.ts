import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  createMatch,
  getActiveMatch,
  applyMove,
  ApiError,
} from '../api/client';
import type { MatchView, Move } from '../api/client';

function moveError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return err.message;
    if (err.status === 409) return 'La partida cambió, actualiza la página';
    if (err.status === 404) return 'Partida no encontrada';
  }
  return 'No se pudo aplicar el movimiento';
}

export function useMatch() {
  const { token } = useAuth();
  const [match, setMatch] = useState<MatchView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveMatch(token!)
      .then(setMatch)
      .catch(() => {}) // 404: no hay activa
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      setMatch(await createMatch(token!));
    } catch {
      setError('No se pudo crear la partida');
    } finally {
      setBusy(false);
    }
  };

  const dispatch = async (move: Move) => {
    if (!match) return;
    setError(null);
    setBusy(true);
    try {
      setMatch(
        await applyMove(token!, match.id, {
          expectedVersion: match.version,
          move,
        }),
      );
    } catch (err) {
      setError(moveError(err));
    } finally {
      setBusy(false);
    }
  };

  return { match, error, busy, loading, start, dispatch };
}
