import { Sparkles } from 'lucide-react';
import type { AutoFillResult } from '../../lib/autofill';

export function AiNotice({ result, mode }: { result: AutoFillResult; mode: 'new' | 'update' }) {
  const count = Object.keys(result.prefill).length;
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-soft px-4 py-3 text-sm text-ink">
      <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-accent" />
      <p>
        <strong>Claude filled {count} field{count === 1 ? '' : 's'}</strong>
        {result.file ? <> from {result.file.name}</> : ' from the website'}
        {result.financialPeriod && <> · financials are {result.financialPeriod}</>}.{' '}
        {mode === 'update' ? 'Fields it found replace current values; the rest are unchanged.' : 'Blank fields weren’t in the source.'}{' '}
        Check the numbers before saving{result.file ? ` — the file will be attached to the deal.` : '.'}
      </p>
    </div>
  );
}
