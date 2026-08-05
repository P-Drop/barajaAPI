import { useState } from 'react';
import { useMatch } from '../hooks/useMatch';
import { Board } from '../components/Board';
import { Countdown } from '../components/Countdown';
import { EndScreen } from '../components/EndScreen';
import { AbandonButton } from '../components/AbandonButton';
import { PileOverlay } from '../components/PileOverlay';
import type { PlayerView, Position } from '../api/client';

function pileCards(view: PlayerView, pos: Position): string[] {
  if (pos.zone === 'cross') return view.cross[pos.index];
  if (pos.zone === 'discard') return view.discard;
  return [];
}

export function GamePage() {
  const { match, error, busy, loading, start, dispatch } = useMatch();
  const [selected, setSelected] = useState<Position | null>(null);
  const [expanded, setExpanded] = useState<Position | null>(null);
  const [counting, setCounting] = useState(false);

  const beginMatch = () => {
    setSelected(null);
    setExpanded(null);
    setCounting(true);
  };

  const handleCountdownDone = async () => {
    await start(); // crea la partida (el reloj arranca ahora, no en el 3-2-1)
    setCounting(false); // solo tras crear -> no parpadea la pantalla anterior
  };

  if (loading) return <p>Cargando...</p>;

  if (counting) return <Countdown onDone={handleCountdownDone} />;

  if (!match) {
    return (
      <button onClick={beginMatch} disabled={busy}>
        Nueva partida
      </button>
    );
  }

  if (match.status !== 'IN_PROGRESS') {
    const durationSeconds = match.finishedAt
      ? Math.floor(
          (new Date(match.finishedAt).getTime() -
            new Date(match.startedAt).getTime()) /
            1000,
        )
      : 0;

    return (
      <EndScreen
        status={match.status}
        stars={match.stars}
        durationSeconds={durationSeconds}
        onRestart={beginMatch}
      />
    );
  }

  const view = match.view;

  const onSelect = (pos: Position) => {
    if (view.hand !== null) {
      dispatch({ type: 'PLACE', from: { zone: 'hand' }, to: pos }); // colocar carta en mano con 1 click
      return;
    }
    if (!selected) {
      setSelected(pos); // primer click -> origen
      return;
    }
    dispatch({ type: 'PLACE', from: selected, to: pos }); // segundo click -> destino
    setSelected(null);
  };

  const onDraw = () => {
    setSelected(null);
    dispatch({ type: 'DRAW' });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Board
        view={view}
        onSelect={onSelect}
        onDraw={onDraw}
        onExpand={setExpanded}
        selected={selected}
      />
      <AbandonButton
        highlighted={view.stock.count === 0}
        disabled={busy}
        onConfirm={() => dispatch({ type: 'ABANDON' })}
      />
      {expanded && (
        <PileOverlay
          cards={pileCards(view, expanded)}
          onClose={() => setExpanded(null)}
        />
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
