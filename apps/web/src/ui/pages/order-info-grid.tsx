export function OrderInfoGrid({
  cards
}: {
  cards: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={`${card.label}-${card.value}`}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{card.label}</p>
          <p className="mt-2 text-sm font-medium text-ink">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
