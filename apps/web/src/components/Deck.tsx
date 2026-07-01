import { useEffect, useState } from 'react';
import { getDeck, type Card as CardData } from '../api/client';
import { Card } from './Card';

export function Deck() {
  const [cards, setCards] = useState<CardData[]>([]);
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
    <div className="deck">
      {cards.map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </div>
  );
}
