import { useEffect, useRef } from 'react';

export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  const dismiss = useRef(onDismiss);

  useEffect(() => {
    dismiss.current = onDismiss; // siempre última versión
  });

  useEffect(() => {
    const t = setTimeout(() => dismiss.current(), duration);
    return () => clearTimeout(t);
  }, [duration]); // temporizador estable: no se reinicia en cada render

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
