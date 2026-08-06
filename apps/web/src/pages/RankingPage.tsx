import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRanking, ApiError } from '../api/client';
import type { Ranking } from '../api/client';

const LIMIT = 20;

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function RankingPage() {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Ranking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Vuelve al index o a la ruta de origen
  const goBack = () =>
    location.key === 'default' ? navigate('/') : navigate(-1);

  useEffect(() => {
    let active = true;
    getRanking(LIMIT, offset)
      .then((r) => {
        if (!active) return;
        setData(r);
        setError(null);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof ApiError
              ? 'No se pudo cargar el ranking'
              : 'Error de red',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [offset]);

  const goTo = (next: number) => {
    setLoading(true);
    setOffset(next);
  };

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Ranking</h1>

      {loading && !data && <p>Cargando ranking...</p>}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {data && data.entries.length === 0 && (
        <p>Aún no hay jugadores clasificados.</p>
      )}

      {data && data.entries.length > 0 && (
        <>
          <ol className="divide-y">
            {data.entries.map((e, i) => (
              <li key={e.nickname} className="flex items-center gap-3 py-2">
                <span className="w-8 text-right font-semibold">
                  {offset + i + 1}
                </span>
                <img
                  src={`/avatars/${e.avatar}`}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
                <span className="flex-1">{e.nickname}</span>
                <span className="w-20 text-right">⭐ {e.stars}</span>
                <span className="w-20 text-right">
                  {formatPlayTime(e.totalPlaySeconds)}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, offset - LIMIT))}
              disabled={offset === 0 || loading}
              className="rounded bg-gray-200 px-3 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm">
              {offset + 1}-{Math.min(offset + LIMIT, data.total)} de{' '}
              {data.total}
            </span>
            <button
              type="button"
              onClick={() => goTo(offset + LIMIT)}
              disabled={offset + LIMIT >= data.total || loading}
              className="rounded bg-gray-200 px-3 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      <p className="mt-6">
        <button type="button" className="underline" onClick={goBack}>
          ← Volver
        </button>
      </p>
    </section>
  );
}
