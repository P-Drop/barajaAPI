import { useState, useEffect, useRef } from 'react';
import { useMatch } from '../hooks/useMatch';
import { Board } from '../components/Board';
import { Countdown } from '../components/Countdown';
import { EndScreen } from '../components/EndScreen';
import { AbandonButton } from '../components/AbandonButton';
import { PileOverlay } from '../components/PileOverlay';
import { StarPanel } from '../components/StarPanel';
import { Toast } from '../components/Toast';
import type { PlayerView, Position } from '../api/client';

type Overlay = { kind: 'inspect'; pos: Position } | { kind: 'recover' };

function pileCards(view: PlayerView, pos: Position): string[] {
  if (pos.zone === 'cross') return view.cross[pos.index];
  if (pos.zone === 'discard') return view.discard;
  return [];
}

export function GamePage() {
  const { match, error, busy, loading, start, dispatch } = useMatch();
  const [selected, setSelected] = useState<Position | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [counting, setCounting] = useState(false);
  const [achievementToast, setAchievementToast] = useState(false);
  const prevStairway = useRef<boolean | null>(null);
  const [stackSource, setStackSource] = useState<{
    fromPile: number;
    cardIndex: number;
  } | null>(null);

  const beginMatch = () => {
    setSelected(null);
    setOverlay(null);
    setStackSource(null);
    setCounting(true);
    setAchievementToast(false);
  };

  const handleCountdownDone = async () => {
    await start(); // crea la partida (el reloj arranca ahora, no en el 3-2-1)
    setCounting(false); // solo tras crear -> no parpadea la pantalla anterior
  };

  // Notificación logro 'Escalera mecánica'
  useEffect(() => {
    if (!match) return; // cargando partida
    const unlocked = match.view.stairwayUnlocked;
    if (prevStairway.current !== null && unlocked && !prevStairway.current) {
      setAchievementToast(true);
    }
    prevStairway.current = unlocked;
  }, [match]);

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
        jokersUsed={match.view.starsUsed}
      />
    );
  }

  const view = match.view;

  // La escalera se mueve solo con el logro y sin carta en la mana
  const canStack =
    overlay?.kind === 'inspect' &&
    overlay.pos.zone === 'cross' &&
    view.stairwayUnlocked &&
    view.hand === null;

  const stackPile =
    overlay?.kind === 'inspect' && overlay.pos.zone === 'cross'
      ? overlay.pos.index
      : -1; // number siempre (TS); solo se usa si canStack es true

  const onSelect = (pos: Position) => {
    // Movimiento en bloque en curso: siguiente click para cruz destino
    if (stackSource) {
      if (pos.zone === 'cross') {
        dispatch({
          type: 'MOVE_STACK',
          fromPile: stackSource.fromPile,
          cardIndex: stackSource.cardIndex,
          toPile: pos.index,
        });
      }
      setStackSource(null); // click fuera de la cruz -> cancelar
      return;
    }

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
    setStackSource(null);
    dispatch({ type: 'DRAW' });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <StarPanel
        available={view.starsAvailable}
        canUse={view.hand === null}
        hasDiscard={view.discard.length > 0}
        onExtraSlot={() => dispatch({ type: 'USE_STAR_EXTRA_SLOT' })}
        onRecover={() => setOverlay({ kind: 'recover' })}
      />
      {stackSource && (
        <p className="font-semibold text-amber-700">
          Elige la cruz destino (o pulsa otra zona para cancelar)
        </p>
      )}
      <Board
        view={view}
        onSelect={onSelect}
        onDraw={onDraw}
        onExpand={(pos) => setOverlay({ kind: 'inspect', pos })}
        selected={selected}
      />
      <AbandonButton
        highlighted={view.stock.count === 0}
        disabled={busy}
        onConfirm={() => dispatch({ type: 'ABANDON' })}
      />
      {overlay?.kind === 'inspect' && (
        <PileOverlay
          cards={pileCards(view, overlay.pos)}
          title={canStack ? 'Elige una carta para mover en bloque' : undefined}
          onSelectCard={
            canStack
              ? (_id, index) => {
                  setStackSource({ fromPile: stackPile, cardIndex: index });
                  setOverlay(null);
                }
              : undefined
          }
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay?.kind === 'recover' && (
        <PileOverlay
          cards={view.discard}
          title="Elige una carta del descarte para recuperar"
          onSelectCard={(cardId) => {
            dispatch({ type: 'USE_STAR_RECOVER', cardId });
            setOverlay(null);
          }}
          onClose={() => setOverlay(null)}
        />
      )}
      {achievementToast && (
        <Toast
          message="¡Logro desbloqueado: Escalera mecánica! 🏆"
          onDismiss={() => setAchievementToast(false)}
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
