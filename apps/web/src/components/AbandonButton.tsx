import { useState } from 'react';

export function AbandonButton({
  highlighted,
  disabled,
  onConfirm,
}: {
  highlighted: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span>¿Seguro? Perderás la partida</span>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className="rounded bg-red-600 px-3 py-1 font-semibold text-white disabled:opacity-50"
        >
          Abandonar
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded bg-gray-300 px-3 py-1"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={`rounded px-3 py-1 font-semibold ${
        highlighted ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
      }`}
    >
      Abandonar
    </button>
  );
}
