import type { PlayerView, Position } from '../api/client';
import { CardSlot } from './CardSlot';
import { StockPile } from './StockPile';

function samePosition(a: Position | null, b: Position): boolean {
  if (!a || a.zone !== b.zone) return false;
  if (a.zone === 'cross' && b.zone === 'cross') return a.index === b.index;
  if (a.zone === 'corner' && b.zone === 'corner') return a.suit === b.suit;
  if (a.zone === 'extra' && b.zone === 'extra') return a.index === b.index;
  return a.zone === 'discard';
}

export function Board({
  view,
  onSelect,
  onDraw,
  onExpand,
  selected,
}: {
  view: PlayerView;
  onSelect?: (pos: Position) => void;
  onDraw?: () => void;
  onExpand?: (pos: Position) => void;
  selected?: Position | null;
}) {
  const cornerCard = (suit: 'OROS' | 'COPAS' | 'ESPADAS' | 'BASTOS') =>
    view.corners[suit] > 0 ? `${suit}-${view.corners[suit]}` : null;
  const crossTop = (i: number) => view.cross[i].at(-1) ?? null;

  const cell = (cardId: string | null, pos: Position) => (
    <CardSlot
      cardId={cardId}
      onClick={onSelect ? () => onSelect(pos) : undefined}
      selected={samePosition(selected ?? null, pos)}
    />
  );

  const expandableCell = (
    cardId: string | null,
    pos: Position,
    count: number,
  ) => (
    <div className="relative">
      {cell(cardId, pos)}
      {onExpand && count >= 2 && (
        <button
          type="button"
          onClick={() => onExpand(pos)}
          aria-label={`Ver ${count} cartas`}
          className="absolute -top-1 -right-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white shadow"
        >
          {count}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Matriz 3x3: cruz (+) y esquinas (diagonales) */}
      <div className="grid grid-cols-3 gap-2">
        {cell(cornerCard('OROS'), { zone: 'corner', suit: 'OROS' })}

        {expandableCell(
          crossTop(0),
          { zone: 'cross', index: 0 },
          view.cross[0].length,
        )}

        {cell(cornerCard('COPAS'), { zone: 'corner', suit: 'COPAS' })}

        {expandableCell(
          crossTop(1),
          { zone: 'cross', index: 1 },
          view.cross[1].length,
        )}
        {expandableCell(
          crossTop(2),
          { zone: 'cross', index: 2 },
          view.cross[2].length,
        )}
        {expandableCell(
          crossTop(3),
          { zone: 'cross', index: 3 },
          view.cross[3].length,
        )}

        {cell(cornerCard('ESPADAS'), { zone: 'corner', suit: 'ESPADAS' })}

        {expandableCell(
          crossTop(4),
          { zone: 'cross', index: 4 },
          view.cross[4].length,
        )}

        {cell(cornerCard('BASTOS'), { zone: 'corner', suit: 'BASTOS' })}
      </div>

      {/* Robo, descarte, slots extra y mano */}
      <div className="flex items-center gap-4">
        <StockPile count={view.stock.count} onClick={onDraw} />
        {expandableCell(
          view.discard.at(-1) ?? null,
          { zone: 'discard' },
          view.discard.length,
        )}
        {view.extra.map((c, i) => (
          <span key={i}>{cell(c, { zone: 'extra', index: i })}</span>
        ))}
        {/* La mano no es seleccionable (solo origen y movimiento obligado)*/}
        <CardSlot cardId={view.hand} selected={true} />
      </div>
    </div>
  );
}
