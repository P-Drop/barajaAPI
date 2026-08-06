export function StarPanel({
  available,
  canUse,
  hasDiscard,
  onExtraSlot,
  onRecover,
}: {
  available: number;
  canUse: boolean; // hand === null
  hasDiscard: boolean;
  onExtraSlot: () => void;
  onRecover: () => void;
}) {
  const disabled = available === 0 || !canUse;

  return (
    <div className="flex items-center gap-3">
      <span
        className="font-semibold text-amber-500"
        aria-label={`${available} estrellas disponibles`}
      >
        ★ {available}
      </span>
      <button
        type="button"
        onClick={onExtraSlot}
        disabled={disabled}
        className="rounded bg-amber-500 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40"
      >
        Espacio extra
      </button>
      <button
        type="button"
        onClick={onRecover}
        disabled={disabled || !hasDiscard}
        className="rounded bg-amber-500 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40"
      >
        Recuperar del descarte
      </button>
    </div>
  );
}
