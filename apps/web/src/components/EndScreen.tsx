function formatDuration(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function EndScreen({
  status,
  stars,
  durationSeconds,
  onRestart,
}: {
  status: 'WON' | 'LOST' | 'ABANDONED';
  stars: number;
  durationSeconds: number;
  onRestart: () => void;
}) {
  const won = status === 'WON';
  const title = won
    ? '¡Victoria!'
    : status === 'ABANDONED'
      ? 'Partida abandonada'
      : 'Derrota';

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-3xl font-bold">{title}</h2>
      {won && (
        <p
          className="text-2xl text-amber-500"
          aria-label={`${stars} estrellas`}
        >
          {stars > 0 ? '⭐ '.repeat(stars) : 'Sin estrellas'}
        </p>
      )}
      <p className="text-lg">Tiempo: {formatDuration(durationSeconds)}</p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"
      >
        Jugar otra vez
      </button>
    </div>
  );
}
