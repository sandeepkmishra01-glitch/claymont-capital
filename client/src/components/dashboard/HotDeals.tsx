import { useDeals, useLookups } from '../../lib/queries';
import { initials, money } from '../../lib/format';
import { useUi } from '../../context/UiContext';
import { PriorityBadge } from '../shared/Badges';
import { EmptyState, LoadingBlock } from '../shared/Overlay';

export function HotDeals() {
  const deals = useDeals();
  const { stageByKey, industryLabel } = useLookups();
  const { openDeal } = useUi();

  if (deals.isLoading) return <LoadingBlock />;
  const hot = (deals.data ?? [])
    .filter((d) => d.status === 'active' && d.priority === 'high')
    .sort((a, b) => (stageByKey.get(b.stageKey ?? '')?.sortOrder ?? 0) - (stageByKey.get(a.stageKey ?? '')?.sortOrder ?? 0));

  if (!hot.length) return <EmptyState title="Nothing flagged high priority" />;

  return (
    <ul className="divide-y divide-line">
      {hot.map((d) => (
        <li key={d.id}>
          <button onClick={() => openDeal(d.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-teal-50/60 sm:px-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-800 font-serif text-sm font-semibold text-white">
              {initials(d.companyName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{d.companyName}</span>
              <span className="block truncate text-xs text-muted">
                {industryLabel(d.industryKey)} · {stageByKey.get(d.stageKey ?? '')?.label} · {money(d.ebitda)} EBITDA
              </span>
            </span>
            <PriorityBadge priority={d.priority} />
          </button>
        </li>
      ))}
    </ul>
  );
}
