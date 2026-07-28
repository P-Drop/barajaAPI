import { ACHIEVEMENTS } from '../data/achievements';

export function AchievementBadge({ id }: { id: string }) {
  const meta = ACHIEVEMENTS[id];
  if (!meta) return <span>{id}</span>;

  return (
    <div className="group relative inline-block" tabIndex={0}>
      <img
        src={`/achievements/${meta.image}`}
        alt={meta.name}
        className="w-16 h-16"
      />

      {/* Tooltip: oculto por defecto, aparece en hover/focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2
                           whitespace-nowrap rounded bg-black/80 px-2 py-1 text-sm text-white
                           opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
      >
        {meta.name}
      </span>
    </div>
  );
}
