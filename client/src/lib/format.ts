import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function money(n: number | null | undefined, digits = 1): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

export function pct(n: number | null | undefined, digits = 1): string {
  return n == null || Number.isNaN(n) ? '—' : `${n.toFixed(digits)}%`;
}

export function multiple(n: number | null | undefined): string {
  return n == null ? '—' : `${n.toFixed(1)}x`;
}

export function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Date-only fields arrive as midnight UTC; read them as calendar dates, not instants.
export function parseDay(d: string): Date {
  return parseISO(d.slice(0, 10));
}

export function shortDate(d: string | null | undefined): string {
  return d ? format(parseISO(d), 'MMM d, yyyy') : '—';
}

export function dueLabel(d: string | null | undefined): string {
  if (!d) return '—';
  const days = differenceInCalendarDays(parseDay(d), new Date());
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1 && days <= 7) return `In ${days} days`;
  if (days < 0) return `${-days}d overdue`;
  return format(parseDay(d), 'MMM d, yyyy');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
