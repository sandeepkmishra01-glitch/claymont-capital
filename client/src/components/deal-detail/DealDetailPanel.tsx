import { useState, type ReactNode } from 'react';
import { CheckCircle2, Pencil, RotateCcw, Trash2, X, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useDeals, useDeleteDeal, useLookups, useUpdateDeal } from '../../lib/queries';
import { initials, money, pct } from '../../lib/format';
import type { Deal } from '../../lib/types';
import { useToast } from '../../context/ToastContext';
import { Modal, SlideOver } from '../shared/Overlay';
import { DealForm } from '../new-deal/DealForm';
import { OverviewTab } from './OverviewTab';
import { FinancialsTab } from './FinancialsTab';
import { DealDocumentsTab } from './DealDocumentsTab';
import { ActivityTab } from './ActivityTab';
import { NotesTab } from './NotesTab';

const TABS = ['Overview', 'Financials', 'Documents', 'Activity', 'Notes'] as const;
type Tab = (typeof TABS)[number];

export function DealDetailPanel({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const deals = useDeals();
  const deal = deals.data?.find((d) => d.id === dealId);
  const [tab, setTab] = useState<Tab>('Overview');
  const [dialog, setDialog] = useState<'edit' | 'pass' | 'delete' | null>(null);

  if (!deal) {
    return (
      <SlideOver label="Deal" onClose={onClose}>
        <div className="flex items-center justify-between p-6">
          <p className="text-muted">{deals.isLoading ? 'Loading deal…' : 'This deal no longer exists.'}</p>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-stone-100" aria-label="Close"><X size={20} /></button>
        </div>
      </SlideOver>
    );
  }

  return (
    <SlideOver label={deal.companyName} onClose={onClose}>
      <Header deal={deal} onClose={onClose} onEdit={() => setDialog('edit')} onPass={() => setDialog('pass')} onDelete={() => setDialog('delete')} />
      <nav className="sticky top-0 z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white px-4 sm:px-8" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-3 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
              tab === t ? 'border-teal-700 text-teal-800' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="flex-1 px-4 py-6 sm:px-8" role="tabpanel">
        {tab === 'Overview' && <OverviewTab deal={deal} />}
        {tab === 'Financials' && <FinancialsTab deal={deal} />}
        {tab === 'Documents' && <DealDocumentsTab dealId={deal.id} />}
        {tab === 'Activity' && <ActivityTab dealId={deal.id} />}
        {tab === 'Notes' && <NotesTab dealId={deal.id} />}
      </div>
      {dialog === 'edit' && <EditDealModal deal={deal} onClose={() => setDialog(null)} />}
      {dialog === 'pass' && <PassDealModal deal={deal} onClose={() => setDialog(null)} />}
      {dialog === 'delete' && <DeleteDealModal deal={deal} onClose={() => setDialog(null)} onDeleted={onClose} />}
    </SlideOver>
  );
}

function Header({ deal, onClose, onEdit, onPass, onDelete }: {
  deal: Deal; onClose: () => void; onEdit: () => void; onPass: () => void; onDelete: () => void;
}) {
  const { stageByKey, industryLabel } = useLookups();
  const update = useUpdateDeal();
  const toast = useToast();
  const stage = stageByKey.get(deal.stageKey ?? '');

  const setStatus = (status: Deal['status'], message: string) =>
    update.mutate({ id: deal.id, status }, { onSuccess: () => toast(message), onError: (e) => toast(e.message, 'error') });

  const stats = [
    { label: 'Revenue', value: money(deal.revenue) },
    { label: 'EBITDA', value: money(deal.ebitda) },
    { label: 'Margin', value: pct(deal.ebitdaMargin) },
    { label: 'Stage', value: deal.status === 'active' ? stage?.shortLabel ?? '—' : deal.status === 'won' ? 'Won' : 'Passed' },
  ];

  return (
    <div className="shrink-0 bg-gradient-to-br from-teal-800 to-teal-600 px-4 pt-5 pb-6 text-white sm:px-8">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 font-serif text-xl font-semibold">{initials(deal.companyName)}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {deal.status === 'active' ? (
            <>
              <HeaderButton onClick={() => setStatus('won', `${deal.companyName} marked as won`)} icon={<CheckCircle2 size={15} />}>Won</HeaderButton>
              <HeaderButton onClick={onPass} icon={<XCircle size={15} />}>Pass</HeaderButton>
            </>
          ) : (
            <HeaderButton onClick={() => setStatus('active', `${deal.companyName} reopened`)} icon={<RotateCcw size={15} />}>Reopen</HeaderButton>
          )}
          <HeaderButton onClick={onEdit} icon={<Pencil size={15} />}>Edit</HeaderButton>
          <HeaderButton onClick={onDelete} icon={<Trash2 size={15} />} label="Delete deal" />
          <HeaderButton onClick={onClose} icon={<X size={18} />} label="Close" />
        </div>
      </div>
      <h2 className="mt-4 text-3xl leading-tight font-semibold text-white">{deal.companyName}</h2>
      <p className="mt-1 text-sm text-white/75">
        {industryLabel(deal.industryKey)}{deal.location && ` · ${deal.location}`}
      </p>
      {deal.status !== 'active' && (
        <p className={clsx('mt-3 inline-block rounded-md px-2.5 py-1 text-xs font-semibold', deal.status === 'won' ? 'bg-emerald-400/25' : 'bg-white/15')}>
          {deal.status === 'won' ? 'Closed — won' : `Passed${deal.closeReason ? ` — ${deal.closeReason}` : ''}`}
        </p>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase">{s.label}</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HeaderButton({ onClick, icon, children, label }: { onClick: () => void; icon: ReactNode; children?: ReactNode; label?: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/12 px-2.5 text-xs font-semibold text-white hover:bg-white/20">
      {icon}{children}
    </button>
  );
}

function EditDealModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const update = useUpdateDeal();
  const toast = useToast();
  return (
    <Modal title={`Edit ${deal.companyName}`} onClose={onClose} width="lg">
      <DealForm
        deal={deal}
        submitLabel="Save changes"
        busy={update.isPending}
        onCancel={onClose}
        onSubmit={(input) => update.mutate({ id: deal.id, ...input }, {
          onSuccess: () => { toast('Deal updated'); onClose(); },
          onError: (e) => toast(e.message, 'error'),
        })}
      />
    </Modal>
  );
}

function PassDealModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const update = useUpdateDeal();
  const toast = useToast();
  const [reason, setReason] = useState('');
  return (
    <Modal
      title="Pass on this deal"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: deal.id, status: 'lost', closeReason: reason.trim() || null }, {
              onSuccess: () => { toast(`Passed on ${deal.companyName}`); onClose(); },
              onError: (e) => toast(e.message, 'error'),
            })}
          >
            Mark as passed
          </button>
        </>
      }
    >
      <label>
        <span className="label">Reason (optional)</span>
        <input autoFocus className="input" placeholder="e.g. fit issues, valuation gap" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <p className="mt-3 text-sm text-muted">The deal leaves the pipeline board but stays in analytics. You can reopen it later.</p>
    </Modal>
  );
}

function DeleteDealModal({ deal, onClose, onDeleted }: { deal: Deal; onClose: () => void; onDeleted: () => void }) {
  const remove = useDeleteDeal();
  const toast = useToast();
  return (
    <Modal
      title="Delete deal?"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate(deal.id, {
              onSuccess: () => { toast(`Deleted ${deal.companyName}`); onDeleted(); },
              onError: (e) => toast(e.message, 'error'),
            })}
          >
            Delete permanently
          </button>
        </>
      }
    >
      <p className="text-sm text-ink">
        This permanently removes <strong>{deal.companyName}</strong> with its notes, stage history, activity, and uploaded documents.
        To keep it in analytics, use <strong>Pass</strong> instead.
      </p>
    </Modal>
  );
}
