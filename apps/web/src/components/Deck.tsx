import { useDeck } from '../hooks/useDeck';
import { Card } from './Card';

export function Deck() {
  const { cards, loading, error, short, shuffle, toggleShort } = useDeck();

  return (
    <section>
      <div className="mb-6 grid grid-cols-3 items-center">
        <div /> {/* espaciador izquierdo para equilibrar la fila */}
        <div className="justify-self-center">
          <button
            type="button"
            onClick={shuffle}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-amber-500 px-5 py-2 font-semibold text-green-900 shadow-md transition hover:bg-amber-400 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Barajar
          </button>
        </div>
        <div className="justify-self-end">
          <label
            className="flex cursor-pointer select-none items-center gap-2 text-sm"
            title="Tamaño de la baraja"
          >
            <span className={short ? 'opacity-50' : 'font-semibold'}>48</span>
            <span className="relative inline-block">
              <input
                type="checkbox"
                checked={short}
                onChange={(e) => toggleShort(e.target.checked)}
                disabled={loading}
                className="peer sr-only"
              />
              <span className="block h-6 w-11 rounded-full bg-green-950 transition-colors peer-checked:bg-amber-500 peer-disabled:opacity-50"></span>
              <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
            </span>
            <span className={short ? 'font-semibold' : 'opacity-50'}>40</span>
          </label>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg text-center bg-red-600 px-3 py-2 text-white font-semibold max-w-xl mx-auto"
        >
          {error}
        </p>
      )}

      {cards.length === 0 && loading && (
        <p className="text-center font-semibold mb-6 max-w-xl mx-auto">
          Cargando baraja...
        </p>
      )}

      {cards.length > 0 && (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3"
          aria-busy={loading}
        >
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
