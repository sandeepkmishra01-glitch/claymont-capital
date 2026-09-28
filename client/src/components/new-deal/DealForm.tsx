import { useState, type FormEvent, type ReactNode } from 'react';
import { useLookups, useMembers } from '../../lib/queries';
import type { Deal, DealInput, Priority } from '../../lib/types';
import { useMe } from '../../context/SessionContext';

type Fields = {
  companyName: string; legalName: string; website: string; industryKey: string; location: string;
  foundedYear: string; employeeCount: string; description: string;
  stageKey: string; priority: Priority; sourceKey: string; dealLeadId: string; assigneeIds: string[];
  revenueM: string; ebitdaM: string; askingMultiple: string; askingPriceM: string;
  nextAction: string; nextActionDueDate: string;
};

const toStr = (n: number | null | undefined, scale = 1) => (n == null ? '' : String(+(n / scale).toFixed(3)));

function initialFields(deal: Deal | undefined, meId: string): Fields {
  return {
    companyName: deal?.companyName ?? '',
    legalName: deal?.legalName ?? '',
    website: deal?.website ?? '',
    industryKey: deal?.industryKey ?? '',
    location: deal?.location ?? '',
    foundedYear: toStr(deal?.foundedYear),
    employeeCount: toStr(deal?.employeeCount),
    description: deal?.description ?? '',
    stageKey: deal?.stageKey ?? 'sourcing',
    priority: deal?.priority ?? 'medium',
    sourceKey: deal?.sourceKey ?? '',
    dealLeadId: deal?.dealLeadId ?? meId,
    assigneeIds: deal?.assigneeIds ?? [meId],
    revenueM: toStr(deal?.revenue, 1e6),
    ebitdaM: toStr(deal?.ebitda, 1e6),
    askingMultiple: toStr(deal?.askingMultiple),
    askingPriceM: toStr(deal?.askingPrice, 1e6),
    nextAction: deal?.nextAction ?? '',
    nextActionDueDate: deal?.nextActionDueDate?.slice(0, 10) ?? '',
  };
}

function num(v: string, scale = 1): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n * scale : NaN;
}

function toInput(f: Fields): { input: DealInput; errors: Partial<Record<keyof Fields, string>> } {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!f.companyName.trim()) errors.companyName = 'Company name is required';
  const revenue = num(f.revenueM, 1e6);
  const ebitda = num(f.ebitdaM, 1e6);
  const askingMultiple = num(f.askingMultiple);
  let askingPrice = num(f.askingPriceM, 1e6);
  const foundedYear = num(f.foundedYear);
  const employeeCount = num(f.employeeCount);
  if (Number.isNaN(revenue) || (revenue ?? 0) < 0) errors.revenueM = 'Enter a positive number';
  if (Number.isNaN(ebitda)) errors.ebitdaM = 'Enter a number';
  if (Number.isNaN(askingMultiple) || (askingMultiple ?? 0) < 0) errors.askingMultiple = 'Enter a positive number';
  if (Number.isNaN(askingPrice) || (askingPrice ?? 0) < 0) errors.askingPriceM = 'Enter a positive number';
  if (foundedYear != null && (!Number.isInteger(foundedYear) || foundedYear < 1800 || foundedYear > 2100)) errors.foundedYear = 'Enter a year';
  if (employeeCount != null && (!Number.isInteger(employeeCount) || employeeCount < 0)) errors.employeeCount = 'Enter a whole number';
  if (askingPrice == null && ebitda && askingMultiple) askingPrice = Math.round(ebitda * askingMultiple);

  return {
    errors,
    input: {
      companyName: f.companyName.trim(),
      legalName: f.legalName.trim() || null,
      website: f.website.trim() || null,
      industryKey: f.industryKey || null,
      location: f.location.trim() || null,
      foundedYear, employeeCount,
      description: f.description.trim() || null,
      stageKey: f.stageKey,
      priority: f.priority,
      sourceKey: f.sourceKey || null,
      dealLeadId: f.dealLeadId || null,
      assigneeIds: [...new Set([f.dealLeadId, ...f.assigneeIds].filter(Boolean))],
      revenue, ebitda, askingMultiple, askingPrice,
      nextAction: f.nextAction.trim() || null,
      nextActionDueDate: f.nextActionDueDate || null,
    },
  };
}

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-bad">{error}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 font-serif text-lg font-semibold text-teal-800">{title}</legend>
      {children}
    </fieldset>
  );
}

interface Props {
  deal?: Deal;
  submitLabel: string;
  busy: boolean;
  onSubmit: (input: DealInput) => void;
  onCancel: () => void;
}

export function DealForm({ deal, submitLabel, busy, onSubmit, onCancel }: Props) {
  const me = useMe();
  const { stages, industries, sources } = useLookups();
  const members = useMembers();
  const [f, setF] = useState<Fields>(() => initialFields(deal, me.id));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const impliedPrice = (() => {
    const e = num(f.ebitdaM), m = num(f.askingMultiple);
    return e && m && !Number.isNaN(e) && !Number.isNaN(m) ? (e * m).toFixed(1) : null;
  })();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const { input, errors } = toInput(f);
    setErrors(errors);
    if (Object.keys(errors).length === 0) onSubmit(input);
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <Section title="Company">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name *" error={errors.companyName} className="sm:col-span-2">
            <input autoFocus className="input" value={f.companyName} onChange={(e) => set('companyName', e.target.value)} maxLength={160} />
          </Field>
          <Field label="Legal name"><input className="input" value={f.legalName} onChange={(e) => set('legalName', e.target.value)} /></Field>
          <Field label="Website"><input className="input" type="url" placeholder="https://" value={f.website} onChange={(e) => set('website', e.target.value)} /></Field>
          <Field label="Industry">
            <select className="input" value={f.industryKey} onChange={(e) => set('industryKey', e.target.value)}>
              <option value="">Select…</option>
              {industries.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </Field>
          <Field label="Location"><input className="input" placeholder="City, ST" value={f.location} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Founded" error={errors.foundedYear}><input className="input" inputMode="numeric" value={f.foundedYear} onChange={(e) => set('foundedYear', e.target.value)} /></Field>
          <Field label="Employees" error={errors.employeeCount}><input className="input" inputMode="numeric" value={f.employeeCount} onChange={(e) => set('employeeCount', e.target.value)} /></Field>
          <Field label="Company profile" className="sm:col-span-2">
            <textarea className="input min-h-[80px]" value={f.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Financials">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Revenue ($M)" error={errors.revenueM}><input className="input" inputMode="decimal" value={f.revenueM} onChange={(e) => set('revenueM', e.target.value)} /></Field>
          <Field label="EBITDA ($M)" error={errors.ebitdaM}><input className="input" inputMode="decimal" value={f.ebitdaM} onChange={(e) => set('ebitdaM', e.target.value)} /></Field>
          <Field label="Asking multiple (x EBITDA)" error={errors.askingMultiple}><input className="input" inputMode="decimal" value={f.askingMultiple} onChange={(e) => set('askingMultiple', e.target.value)} /></Field>
          <Field label="Asking price / EV ($M)" error={errors.askingPriceM}>
            <input className="input" inputMode="decimal" placeholder={impliedPrice ? `${impliedPrice} (implied)` : ''} value={f.askingPriceM} onChange={(e) => set('askingPriceM', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Deal">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stage">
            <select className="input" value={f.stageKey} onChange={(e) => set('stageKey', e.target.value)}>
              {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={f.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </Field>
          <Field label="Source">
            <select className="input" value={f.sourceKey} onChange={(e) => set('sourceKey', e.target.value)}>
              <option value="">Select…</option>
              {sources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Deal lead">
            <select className="input" value={f.dealLeadId} onChange={(e) => set('dealLeadId', e.target.value)}>
              {(members.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <span className="label">Deal team</span>
            <div className="flex flex-wrap gap-2">
              {(members.data ?? []).map((m) => {
                const on = f.assigneeIds.includes(m.id) || m.id === f.dealLeadId;
                return (
                  <button
                    type="button"
                    key={m.id}
                    disabled={m.id === f.dealLeadId}
                    onClick={() => set('assigneeIds', on ? f.assigneeIds.filter((x) => x !== m.id) : [...f.assigneeIds, m.id])}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-line text-muted hover:border-teal-500'}`}
                  >
                    {m.displayName}{m.id === f.dealLeadId && ' (lead)'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Next step">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Next action"><input className="input" placeholder="e.g. Send IOI" value={f.nextAction} onChange={(e) => set('nextAction', e.target.value)} /></Field>
          <Field label="Due date"><input className="input" type="date" value={f.nextActionDueDate} onChange={(e) => set('nextActionDueDate', e.target.value)} /></Field>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-line bg-white px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
