import { useEffect, useState } from 'react';
import { getDeck, type Card } from '../api/client';

export function Deck() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeck()
      .then(setCards)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Error desconocido'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando baraja...</p>;
  if (error) return <p role="alert">Error: {error}</p>;

  return (
    <ul>
      {cards.map((card) => (
        <li key={card.id}>{card.name}</li>
      ))}
    </ul>
  );
}
