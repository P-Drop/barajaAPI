import type { Card as CardData } from '../api/client';

export function Card({ card }: { card: CardData }) {
  // El API usa '.png' como identificador convencional, pero los assets son WebP
  const file = card.image.replace(/\.png$/, '.webp');
  return (
    <img
      className="w-full h-auto rounded-lg shadow-md transition hover:scale-105 hover:shadow-xl"
      src={`${import.meta.env.BASE_URL}cards/${file}`}
      alt={card.name}
      loading="lazy"
      width={208}
      height={319}
    />
  );
}
