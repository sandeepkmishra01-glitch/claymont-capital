import { useActivity, useDeals, useMembers } from '../../lib/queries';
import { shortDate } from '../../lib/format';
import { useUi } from '../../context/UiContext';
import { Avatar } from '../shared/Avatar';
import { EmptyState, LoadingBlock } from '../shared/Overlay';

export function RecentActivity() {
  const activity = useActivity(undefined, 8);
  const deals = useDeals();
  const members = useMembers();
  const { openDeal } = useUi();
  const dealName = new Map((deals.data ?? []).map((d) => [d.id, d.companyName]));

  if (activity.isLoading) return <LoadingBlock />;
  if (!activity.data?.length) return <EmptyState title="No activity yet" />;

  return (
    <ul className="divide-y divide-line">
      {activity.data.map((a) => {
        const member = a.memberId ? members.byId.get(a.memberId) : undefined;
        const deal = a.dealId ? dealName.get(a.dealId) : undefined;
        return (
          <li key={a.id} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
            <Avatar member={member} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-ink">
                <span className="font-semibold">{member?.displayName ?? 'Former member'}</span>
                <span className="text-muted"> · {a.actionText}</span>
                {deal && (
                  <>
                    <span className="text-muted"> on </span>
                    <button onClick={() => openDeal(a.dealId!)} className="font-semibold text-teal-700 hover:underline">{deal}</button>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-faint">{shortDate(a.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
