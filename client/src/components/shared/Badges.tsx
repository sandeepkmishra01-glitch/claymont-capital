import clsx from 'clsx';
import type { Priority, Stage } from '../../lib/types';

export function StageDot({ color, className }: { color: string; className?: string }) {
  return <span className={clsx('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)} style={{ background: color }} />;
}

export function StageBadge({ stage }: { stage: Stage | undefined }) {
  if (!stage) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `color-mix(in srgb, ${stage.colorHex} 14%, white)`, color: `color-mix(in srgb, ${stage.colorHex} 75%, black)` }}
    >
      <StageDot color={stage.colorHex} className="h-1.5 w-1.5" />
      {stage.label}
    </span>
  );
}

export function IndustryTag({ label }: { label: string }) {
  return (
    <span className="inline-block max-w-full truncate rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
      {label}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-stone-50 text-stone-500 border-stone-200',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  high: '#d64545',
  medium: '#d9912b',
  low: '#a8a69e',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={clsx('rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase', PRIORITY_STYLE[priority])}>
      {priority}
    </span>
  );
}
