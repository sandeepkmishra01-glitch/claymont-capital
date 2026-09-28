import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeals, useDeleteMember, useMembers, useSaveMember } from '../../lib/queries';
import { ROLES, type Member } from '../../lib/types';
import { useMe } from '../../context/SessionContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../shared/Avatar';
import { KpiCard } from '../shared/KpiCard';
import { LoadingBlock, Modal } from '../shared/Overlay';

export function TeamPage() {
  const members = useMembers();
  const deals = useDeals();
  const me = useMe();
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  if (members.isLoading || deals.isLoading) return <LoadingBlock />;
  const all = deals.data ?? [];
  const stats = (m: Member) => ({
    active: all.filter((d) => d.status === 'active' && d.assigneeIds.includes(m.id)).length,
    lead: all.filter((d) => d.status === 'active' && d.dealLeadId === m.id).length,
    closed: all.filter((d) => d.status === 'won' && d.assigneeIds.includes(m.id)).length,
  });
  const list = members.data ?? [];
  const totalAssignments = list.reduce((s, m) => s + stats(m).active, 0);
  const leads = new Set(all.filter((d) => d.status === 'active').map((d) => d.dealLeadId)).size;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Team members" value={list.length} hint="in this workspace" />
        <KpiCard label="Avg deals per member" value={list.length ? (totalAssignments / list.length).toFixed(1) : '—'} hint="active deal assignments" />
        <KpiCard label="Deal leads" value={leads} hint="members leading active deals" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Team Members</h2>
          <p className="text-sm text-muted">Click a card to edit</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} strokeWidth={2.5} /> Add Member</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => {
          const s = stats(m);
          return (
            <article key={m.id} className="card group relative p-6 text-center">
              <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <button onClick={() => setEditing(m)} className="rounded-md p-1.5 text-muted hover:bg-teal-50 hover:text-teal-800" aria-label={`Edit ${m.displayName}`}>
                  <Pencil size={15} />
                </button>
                {m.id !== me.id && (
                  <button onClick={() => setRemoving(m)} className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-bad" aria-label={`Remove ${m.displayName}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <button onClick={() => setEditing(m)} className="w-full">
                <Avatar member={m} size="lg" className="mx-auto" />
                <h3 className="mt-3 font-sans text-lg font-semibold text-ink">
                  {m.displayName}{m.id === me.id && <span className="ml-1.5 text-xs font-medium text-muted">(you)</span>}
                </h3>
                <p className="mt-0.5 text-xs font-bold tracking-[0.08em] text-teal-700 uppercase">{m.role ?? 'Team member'}</p>
                <p className="mt-2 truncate text-sm text-muted">{m.email ?? '—'}</p>
              </button>
              <dl className="mt-4 grid grid-cols-3 border-t border-line pt-4">
                {([['Active', s.active], ['Lead on', s.lead], ['Closed', s.closed]] as const).map(([label, v]) => (
                  <div key={label}>
                    <dd className="font-serif text-2xl font-semibold text-teal-800">{v}</dd>
                    <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</dt>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>

      {editing && <MemberModal member={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {removing && <RemoveMemberModal member={removing} leadCount={stats(removing).lead} onClose={() => setRemoving(null)} />}
    </div>
  );
}

function MemberModal({ member, onClose }: { member?: Member; onClose: () => void }) {
  const save = useSaveMember();
  const toast = useToast();
  const [name, setName] = useState(member?.displayName ?? '');
  const [role, setRole] = useState(member?.role ?? 'Associate');
  const [email, setEmail] = useState(member?.email ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email or leave it blank');
    save.mutate(
      { id: member?.id, displayName: name.trim(), role, email: email.trim() || null },
      {
        onSuccess: () => { toast(member ? 'Member updated' : `${name.trim()} added`); onClose(); },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Modal title={member ? 'Edit member' : 'Add member'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="label">Full name</span><input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block">
          <span className="label">Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">Email</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {error && <p className="text-sm text-bad">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={save.isPending}>{member ? 'Save' : 'Add member'}</button>
        </div>
      </form>
    </Modal>
  );
}

function RemoveMemberModal({ member, leadCount, onClose }: { member: Member; leadCount: number; onClose: () => void }) {
  const remove = useDeleteMember();
  const toast = useToast();
  return (
    <Modal
      title={`Remove ${member.displayName}?`}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate(member.id, {
              onSuccess: () => { toast(`${member.displayName} removed`); onClose(); },
              onError: (e) => toast(e.message, 'error'),
            })}
          >
            Remove
          </button>
        </>
      }
    >
      <p className="text-sm text-ink">
        Their notes and activity stay but will show as “Former member”.
        {leadCount > 0 && <> They lead <strong>{leadCount} active deal{leadCount === 1 ? '' : 's'}</strong>, which will have no lead until you reassign.</>}
      </p>
    </Modal>
  );
}
