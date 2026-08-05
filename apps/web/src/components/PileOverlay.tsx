import { CardSlot } from './CardSlot';

export function PileOverlay({
  cards,
  onClose,
}: {
  cards: string[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-w-[90vw] flex-wrap items-center gap-2 overflow-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {cards.map((id, i) => (
          <CardSlot key={i} cardId={id} />
        ))}
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
