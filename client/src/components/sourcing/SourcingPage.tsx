import { useDeals, useLookups, useStageHistory } from '../../lib/queries';
import { sourcePerformance } from '../../lib/metrics';
import { money, pct } from '../../lib/format';
import { KpiCard } from '../shared/KpiCard';
import { LoadingBlock, Panel } from '../shared/Overlay';

export function SourcingPage() {
  const deals = useDeals();
  const history = useStageHistory();
  const { stages, sources, sourceLabel } = useLookups();

  if (deals.isLoading || history.isLoading) return <LoadingBlock />;
  const all = deals.data ?? [];
  const perf = sourcePerformance(all, history.data ?? [], stages, sources.map((s) => s.key));
  const maxDeals = Math.max(1, ...perf.rows.map((r) => r.deals));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Sourcing funnel" value={all.length} hint="total deals tracked" />
        <KpiCard label="Active sources" value={perf.activeSources} hint={`of ${sources.length} channels generating flow`} />
        <KpiCard label="Conversion to LOI+" value={pct(perf.conversionToLoi, 0)} hint="deals that reached LOI or later" />
      </div>

      <Panel title="Source Performance" subtitle="Deal flow by origination channel · advanced = reached NDA or later">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-stone-50 text-left">
                <th className="eyebrow px-5 py-3 sm:px-6">Source</th>
                <th className="eyebrow px-3 py-3 text-right">Deals</th>
                <th className="eyebrow w-[28%] px-3 py-3"><span className="sr-only">Share</span></th>
                <th className="eyebrow px-3 py-3 text-right">Advanced</th>
                <th className="eyebrow px-5 py-3 text-right sm:px-6">Pipeline value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {perf.rows.map((r) => (
                <tr key={r.key} className={r.deals ? '' : 'text-faint'}>
                  <td className="px-5 py-3.5 font-semibold sm:px-6">{sourceLabel(r.key)}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">{r.deals}</td>
                  <td className="px-3 py-3.5">
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${(r.deals / maxDeals) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    {r.advanced} <span className="text-muted">({pct(r.advancedPct, 0)})</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold sm:px-6">{money(r.pipelineValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
