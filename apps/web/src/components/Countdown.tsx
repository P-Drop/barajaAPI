import { useEffect, useState } from 'react';

export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);

  // 3, 2, 1 (1s cada uno) y una pausa final con mensaje legible
  useEffect(() => {
    if (n < 0) {
      onDone(); // terminó la pausa -> comienza la partida
      return;
    }
    // n>=1 muestra el número 1s; n===0 es mensaje con 800ms de pausa
    const t = setTimeout(() => setN(n - 1), n === 0 ? 800 : 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="grid min-h-[50vh] place-items-center">
      <span className="text-8xl font-black text-amber-500 tabular-nums">
        {n > 0 ? n : '¡Suerte!'}
      </span>
    </div>
  );
}
