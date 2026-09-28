import type { Deal } from '../../lib/types';
import { money, multiple, pct } from '../../lib/format';

export function FinancialsTab({ deal }: { deal: Deal }) {
  const evRevenue = deal.askingPrice && deal.revenue ? deal.askingPrice / deal.revenue : null;
  const rows: { label: string; value: string; note?: string }[] = [
    { label: 'Revenue (LTM)', value: money(deal.revenue, 2) },
    { label: 'EBITDA (LTM)', value: money(deal.ebitda, 2) },
    { label: 'EBITDA margin', value: pct(deal.ebitdaMargin) },
    { label: 'Asking price / EV', value: money(deal.askingPrice, 2) },
    { label: 'Asking multiple', value: multiple(deal.askingMultiple), note: 'EV / EBITDA' },
    { label: 'Implied EV / Revenue', value: evRevenue ? `${evRevenue.toFixed(2)}x` : '—' },
  ];
  const marginPct = Math.max(0, Math.min(100, deal.ebitdaMargin ?? 0));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-line p-4">
            <p className="eyebrow">{r.label}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-teal-800">{r.value}</p>
            {r.note && <p className="text-xs text-muted">{r.note}</p>}
          </div>
        ))}
      </div>
      {deal.revenue != null && deal.ebitda != null && (
        <div className="rounded-xl border border-line p-4">
          <p className="eyebrow">Revenue to EBITDA</p>
          <div className="mt-3 h-6 overflow-hidden rounded-md bg-teal-100">
            <div className="h-full rounded-md bg-teal-600" style={{ width: `${marginPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {money(deal.ebitda)} of {money(deal.revenue)} revenue converts to EBITDA ({pct(deal.ebitdaMargin)}).
          </p>
        </div>
      )}
      <p className="text-sm text-muted">Use <strong>Edit</strong> at the top of the panel to update these figures.</p>
    </div>
  );
}
