interface StatusCard {
  label: string;
  value: number;
}

interface DashboardCardsProps {
  cards: StatusCard[];
}

export function DashboardCards({ cards }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-slate-200 bg-paper p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
