export function StockPile({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  const cls =
    'w-20 aspect-[2/3] rounded-lg bg-emerald-900 text-white grid place-items-center font-bold';
  return onClick ? (
    <button onClick={onClick} className={cls}>
      {count}
    </button>
  ) : (
    <div className={cls}>{count}</div>
  );
}
