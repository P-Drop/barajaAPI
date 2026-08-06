import { CardSlot } from './CardSlot';

export function PileOverlay({
  cards,
  onClose,
  onSelectCard,
  title,
}: {
  cards: string[];
  onClose: () => void;
  onSelectCard?: (cardId: string, index: number) => void;
  title?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-w-[90vw] flex-wrap items-center gap-3 overflow-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <p className="font-semibold">{title}</p>}
        <div className="flex max-w-full flex-wrap items-center gap-2 overflow-auto">
          {cards.map((id, i) => (
            <CardSlot
              key={i}
              cardId={id}
              onClick={onSelectCard ? () => onSelectCard(id, i) : undefined}
            />
          ))}
        </div>
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
