import { differenceInCalendarDays } from 'date-fns';
import clsx from 'clsx';
import { useDeals, useLookups } from '../../lib/queries';
import { dueLabel, parseDay } from '../../lib/format';
import { useUi } from '../../context/UiContext';
import { StageDot } from '../shared/Badges';
import { EmptyState, LoadingBlock } from '../shared/Overlay';

export function UpcomingMilestones() {
  const deals = useDeals();
  const { stageByKey } = useLookups();
  const { openDeal } = useUi();

  if (deals.isLoading) return <LoadingBlock />;
  const upcoming = (deals.data ?? [])
    .filter((d) => d.status === 'active' && d.nextAction && d.nextActionDueDate)
    .sort((a, b) => a.nextActionDueDate!.localeCompare(b.nextActionDueDate!))
    .slice(0, 6);

  if (!upcoming.length) return <EmptyState title="No upcoming milestones" body="Add a next action and due date to a deal to see it here." />;

  return (
    <ul className="divide-y divide-line">
      {upcoming.map((d) => {
        const stage = stageByKey.get(d.stageKey ?? '');
        const days = differenceInCalendarDays(parseDay(d.nextActionDueDate!), new Date());
        return (
          <li key={d.id}>
            <button onClick={() => openDeal(d.id)} className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-teal-50/60 sm:px-6">
              <StageDot color={stage?.colorHex ?? '#999'} className="mt-1.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {d.companyName} <span className="font-normal text-muted">— {d.nextAction}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  <span className={clsx(days < 0 && 'font-semibold text-bad', days >= 0 && days <= 3 && 'font-semibold text-amber-accent')}>
                    {dueLabel(d.nextActionDueDate)}
                  </span>
                  {stage && <> · {stage.label}</>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
