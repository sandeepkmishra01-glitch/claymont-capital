import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: 'good' | 'bad' | 'muted';
  icon?: LucideIcon;
  valueClassName?: string;
}

export function KpiCard({ label, value, hint, hintTone = 'muted', icon: Icon, valueClassName }: Props) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <span className="eyebrow">{label}</span>
      </div>
      <div className={clsx('mt-3 font-serif text-3xl font-semibold text-teal-800 sm:text-4xl', valueClassName)}>{value}</div>
      {hint && (
        <div
          className={clsx(
            'mt-1.5 text-sm font-medium',
            hintTone === 'good' && 'text-good',
            hintTone === 'bad' && 'text-bad',
            hintTone === 'muted' && 'text-muted',
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
