import type { Card as CardData } from '../api/client';

export function Card({ card }: { card: CardData }) {
  // El API usa '.png' como identificador convencional, pero los assets son WebP
  const file = card.image.replace(/\.png$/, '.webp');
  return (
    <img
      className="card"
      src={`${import.meta.env.BASE_URL}cards/${file}`}
      alt={card.name}
      loading="lazy"
      width={208}
      height={319}
    />
  );
}
