import { Card } from './Card';
import { cardFromId } from '../lib/cards';

export function CardSlot({
  cardId,
  onClick,
  selected,
}: {
  cardId: string | null;
  onClick?: () => void;
  selected?: boolean;
}) {
  const content = cardId ? (
    <Card card={cardFromId(cardId)} />
  ) : (
    <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-400/40" />
  );
  if (!onClick) return <div className="w-20 aspect-[2/3]">{content}</div>;
  return (
    <button
      onClick={onClick}
      className={`w-20 aspect-[2/3] rounded-lg ${selected ? 'ring-4 ring-amber-400' : ''}`}
    >
      {content}
    </button>
  );
}
