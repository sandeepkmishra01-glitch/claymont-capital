import clsx from 'clsx';
import { useDeals, useLookups } from '../../lib/queries';
import { industryRollup } from '../../lib/metrics';
import { money } from '../../lib/format';
import { KpiCard } from '../shared/KpiCard';
import { LoadingBlock } from '../shared/Overlay';

export function IndustriesPage() {
  const deals = useDeals();
  const { industries, industryLabel } = useLookups();

  if (deals.isLoading) return <LoadingBlock />;
  const rows = industryRollup(deals.data ?? [], industries.map((i) => i.key))
    .filter((r) => r.key !== 'other' || r.total > 0)
    .sort((a, b) => b.active - a.active || b.pipelineValue - a.pipelineValue || b.total - a.total);
  const covered = rows.filter((r) => r.active > 0).length;
  const top = rows[0]?.active ? rows[0] : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Industries tracked" value={rows.length} />
        <KpiCard
          label="Most active sector"
          value={top ? industryLabel(top.key) : '—'}
          valueClassName="!text-2xl leading-snug"
          hint={top ? `${top.active} active · ${money(top.pipelineValue)} asking EV` : undefined}
        />
        <KpiCard label="Sector coverage" value={`${covered}/${rows.length}`} hint="industries with active deals" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <article key={r.key} className={clsx('card overflow-hidden', !r.active && 'opacity-70')}>
            <div className={clsx('h-1', r.active ? 'bg-teal-600' : 'bg-stone-200')} />
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold">{industryLabel(r.key)}</h2>
              <p className="mt-1 text-sm text-muted">{r.active} active · {r.total} total deal{r.total === 1 ? '' : 's'}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <dt className="eyebrow">Pipeline rev</dt>
                  <dd className="mt-1 font-serif text-xl font-semibold text-teal-800">{money(r.revenue)}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Pipeline EBITDA</dt>
                  <dd className="mt-1 font-serif text-xl font-semibold text-teal-800">{money(r.ebitda)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
