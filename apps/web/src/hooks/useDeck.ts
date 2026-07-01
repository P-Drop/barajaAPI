import { useCallback, useEffect, useState } from 'react';
import {
  getDeck,
  getShuffledDeck,
  ApiError,
  type Card,
  type Deck,
} from '../api/client';

type Loader = (short: boolean) => Promise<Deck>;

function errorMessage(e: unknown): string {
  return e instanceof ApiError && e.status === 429
    ? 'Demasiadas peticiones. Espera unos segundos e inténtalo de nuevo.'
    : 'No se pudo cargar la baraja. Inténtalo de nuevo.';
}

export function useDeck() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [short, setShort] = useState(false);

  // Acción reutilizable: se llama desde event handlers -> setState síncrono

  const run = useCallback(async (loader: Loader, s: boolean) => {
    setLoading(true);
    try {
      setCards(await loader(s));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial. setState SOLO en callbacks async
  useEffect(() => {
    let ignore = false;
    getDeck(false)
      .then((d) => {
        if (!ignore) setCards(d);
      })
      .catch((e) => {
        if (!ignore) setError(errorMessage(e));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return {
    cards,
    loading,
    error,
    short,
    shuffle: () => run(getShuffledDeck, short),
    toggleShort: (s: boolean) => {
      setShort(s);
      run(getDeck, s);
    },
  };
}
