import { differenceInCalendarDays } from 'date-fns';
import clsx from 'clsx';
import type { Deal, Member } from '../../lib/types';
import { dueLabel, money, parseDay, pct } from '../../lib/format';
import { AvatarStack } from '../shared/Avatar';
import { IndustryTag, PRIORITY_DOT } from '../shared/Badges';

interface Props {
  deal: Deal;
  industry: string;
  members: Map<string, Member>;
  dragging?: boolean;
}

export function DealCard({ deal, industry, members, dragging }: Props) {
  const days = deal.nextActionDueDate ? differenceInCalendarDays(parseDay(deal.nextActionDueDate), new Date()) : null;
  return (
    <div
      className={clsx(
        'rounded-xl border border-line bg-white p-4 text-left shadow-[0_1px_2px_rgba(20,40,40,0.05)] transition-shadow',
        dragging ? 'rotate-1 shadow-xl ring-2 ring-teal-500/40' : 'hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-[15px] leading-snug font-semibold text-ink">{deal.companyName}</h3>
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ background: PRIORITY_DOT[deal.priority] }}
          title={`${deal.priority} priority`}
        />
      </div>
      <div className="mt-2"><IndustryTag label={industry} /></div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Revenue</dt>
          <dd className="font-semibold text-ink">{money(deal.revenue)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">EBITDA</dt>
          <dd className="font-semibold text-ink">
            {money(deal.ebitda)} <span className="font-normal text-muted">{pct(deal.ebitdaMargin, 0)}</span>
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3">
        <AvatarStack members={deal.assigneeIds.map((id) => members.get(id))} />
        <span
          className={clsx('text-xs', days != null && days < 0 ? 'font-semibold text-bad' : days != null && days <= 3 ? 'font-semibold text-amber-accent' : 'text-muted')}
          title={deal.nextAction ?? undefined}
        >
          {dueLabel(deal.nextActionDueDate)}
        </span>
      </div>
    </div>
  );
}
