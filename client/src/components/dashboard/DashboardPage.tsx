import { Link } from 'react-router-dom';
import { BarChart3, ChevronUp, Clock, DollarSign, SquareStack } from 'lucide-react';
import { useDeals, useLookups } from '../../lib/queries';
import { portfolioKpis, stageCounts } from '../../lib/metrics';
import { money, multiple } from '../../lib/format';
import { KpiCard } from '../shared/KpiCard';
import { LoadingBlock, Panel } from '../shared/Overlay';
import { UpcomingMilestones } from './UpcomingMilestones';
import { RecentActivity } from './RecentActivity';
import { HotDeals } from './HotDeals';

export function DashboardPage() {
  const deals = useDeals();
  const { stages, ready } = useLookups();
  const all = deals.data ?? [];
  const k = portfolioKpis(all);
  const dist = stageCounts(all, stages);
  const maxCount = Math.max(1, ...dist.map((d) => d.count));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={SquareStack}
          label="Active deals"
          value={k.activeCount}
          hint={<span className="inline-flex items-center gap-1"><ChevronUp size={14} />{k.newThisMonth} new this month</span>}
          hintTone={k.newThisMonth ? 'good' : 'muted'}
        />
        <KpiCard icon={DollarSign} label="Pipeline value" value={money(k.pipelineValue)} hint="asking EV, active deals" />
        <KpiCard icon={BarChart3} label="Aggregate EBITDA" value={money(k.aggregateEbitda)} hint="across active deals" />
        <KpiCard icon={Clock} label="Avg asking multiple" value={multiple(k.avgMultiple)} hint="EBITDA basis" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Pipeline Distribution"
          subtitle="Active deals by stage"
          action={<Link to="/pipeline" className="btn-secondary shrink-0">View Pipeline →</Link>}
        >
          {deals.isLoading || !ready ? <LoadingBlock /> : (
            <ul className="space-y-3 px-5 py-5 sm:px-6">
              {dist.map(({ stage, count }) => (
                <li key={stage.key} className="grid grid-cols-[120px_1fr_28px] items-center gap-4 sm:grid-cols-[150px_1fr_32px]">
                  <span className="truncate text-sm font-medium text-ink">{stage.label}</span>
                  <span className="h-5 overflow-hidden rounded-md bg-stone-100">
                    <span
                      className="block h-full rounded-md transition-[width] duration-500"
                      style={{ width: `${(count / maxCount) * 100}%`, background: stage.colorHex }}
                    />
                  </span>
                  <span className="text-right text-sm font-semibold text-ink">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="xl:col-span-2" title="Upcoming Milestones" subtitle="Next steps across active deals">
          <UpcomingMilestones />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Activity" subtitle="Latest team actions">
          <RecentActivity />
        </Panel>
        <Panel title="Hot Deals" subtitle="High priority — needs attention">
          <HotDeals />
        </Panel>
      </div>
    </div>
  );
}
