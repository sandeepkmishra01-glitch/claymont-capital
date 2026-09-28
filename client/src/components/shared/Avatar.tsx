import clsx from 'clsx';
import { initials } from '../../lib/format';
import type { Member } from '../../lib/types';

const SIZES = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-20 w-20 text-2xl' } as const;

export function Avatar({ member, size = 'sm', className }: { member: Member | undefined; size?: keyof typeof SIZES; className?: string }) {
  const name = member?.displayName ?? 'Former member';
  return (
    <span
      title={name}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        className,
      )}
      style={{
        background: member
          ? `linear-gradient(135deg, ${member.avatarColor}, color-mix(in srgb, ${member.avatarColor} 70%, #0b1f1f))`
          : '#b4b2aa',
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ members, max = 3 }: { members: (Member | undefined)[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((m, i) => (
        <Avatar key={m?.id ?? i} member={m} className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[11px] font-semibold text-teal-800 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  );
}
