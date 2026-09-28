import { useActivity, useMembers } from '../../lib/queries';
import { shortDate } from '../../lib/format';
import { Avatar } from '../shared/Avatar';
import { EmptyState, LoadingBlock } from '../shared/Overlay';

export function ActivityTab({ dealId }: { dealId: string }) {
  const activity = useActivity(dealId, 200);
  const members = useMembers();

  if (activity.isLoading) return <LoadingBlock />;
  if (!activity.data?.length) return <EmptyState title="No activity yet" />;

  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-6">
      {activity.data.map((a) => {
        const m = a.memberId ? members.byId.get(a.memberId) : undefined;
        return (
          <li key={a.id} className="relative">
            <span className="absolute top-0.5 -left-[39px]"><Avatar member={m} className="ring-4 ring-white" /></span>
            <p className="text-sm text-ink">
              <span className="font-semibold">{m?.displayName ?? 'Former member'}</span>
              <span className="text-muted"> · {a.actionText}</span>
            </p>
            <p className="text-xs text-faint">{shortDate(a.createdAt)}</p>
          </li>
        );
      })}
    </ol>
  );
}
