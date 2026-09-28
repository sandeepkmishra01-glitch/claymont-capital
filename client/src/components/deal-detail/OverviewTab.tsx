import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useLookups, useMembers, useUpdateDeal } from '../../lib/queries';
import type { Deal } from '../../lib/types';
import { dueLabel } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { AvatarStack } from '../shared/Avatar';
import { PriorityBadge } from '../shared/Badges';

export function OverviewTab({ deal, onAutoFill }: { deal: Deal; onAutoFill: () => void }) {
  const { stages, stageByKey, industryLabel, sourceLabel } = useLookups();
  const members = useMembers();
  const update = useUpdateDeal();
  const toast = useToast();
  const current = stageByKey.get(deal.stageKey ?? '')?.sortOrder ?? 0;
  const editable = deal.status === 'active';

  const moveTo = (key: string) => {
    if (key === deal.stageKey) return;
    update.mutate({ id: deal.id, stageKey: key }, {
      onSuccess: () => toast(`Moved to ${stageByKey.get(key)?.label}`),
      onError: (e) => toast(e.message, 'error'),
    });
  };

  const lead = members.byId.get(deal.dealLeadId ?? '');
  const fields: [string, ReactNode][] = [
    ['Legal name', deal.legalName],
    ['Website', deal.website && (
      <a href={deal.website} target="_blank" rel="noreferrer noopener" className="break-all text-teal-700 underline">
        {deal.website.replace(/^https?:\/\//, '')}
      </a>
    )],
    ['Founded', deal.foundedYear],
    ['Employees', deal.employeeCount?.toLocaleString()],
    ['Industry', industryLabel(deal.industryKey)],
    ['Location', deal.location],
    ['Source', deal.sourceKey && sourceLabel(deal.sourceKey)],
    ['Priority', <PriorityBadge key="p" priority={deal.priority} />],
    ['Deal lead', lead?.displayName],
    ['Deal team', <AvatarStack key="t" members={deal.assigneeIds.map((id) => members.byId.get(id))} max={6} />],
  ];

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold">Pipeline Stage</h3>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {stages.map((s) => {
            const done = s.sortOrder < current;
            const isCurrent = s.sortOrder === current;
            return (
              <button
                key={s.key}
                disabled={!editable || update.isPending}
                onClick={() => moveTo(s.key)}
                title={s.label}
                aria-current={isCurrent ? 'step' : undefined}
                className={clsx(
                  'rounded-md px-1 py-2.5 text-xs font-semibold transition-colors disabled:cursor-default',
                  isCurrent && 'bg-amber-accent text-white shadow-sm',
                  done && 'bg-teal-100 text-teal-800',
                  !isCurrent && !done && 'bg-stone-100 text-muted enabled:hover:bg-stone-200',
                )}
              >
                {s.shortLabel}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-muted">
          {editable ? 'Click any stage to move the deal.' : 'Reopen the deal to change its stage.'}
        </p>
      </section>

      {deal.nextAction && (
        <section className="rounded-xl border border-line bg-cream/60 p-4">
          <p className="eyebrow">Next step</p>
          <p className="mt-1 font-semibold text-ink">{deal.nextAction}</p>
          <p className="text-sm text-muted">{dueLabel(deal.nextActionDueDate)}</p>
        </section>
      )}

      <button
        onClick={onAutoFill}
        className="flex w-full items-start gap-3 rounded-xl border border-dashed border-amber-accent/50 bg-amber-soft/60 p-4 text-left text-sm transition-colors hover:bg-amber-soft"
      >
        <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-accent" />
        <span className="text-muted">
          <span className="font-semibold text-teal-800">Upload a CIM or financial model</span> — Claude extracts revenue, EBITDA, industry,
          asking terms, highlights, and risks for you to review.
        </span>
      </button>

      <section>
        <h3 className="text-xl font-semibold">Company Profile</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{deal.description || <span className="text-faint">No description yet.</span>}</p>
        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 text-[15px] text-ink">{value ?? <span className="text-faint">—</span>}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
