import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Download, Link2, LogOut, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api, saveBlob } from '../../lib/api';
import { useMe, useSession } from '../../context/SessionContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../shared/Overlay';

const TABS = ['Profile & Sharing', 'Data & Backup'] as const;

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  return (
    <Modal title="Settings" onClose={onClose} width="lg">
      <div className="-mx-6 -mt-5 mb-6 flex gap-1 border-b border-line bg-stone-50 px-6" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx('border-b-2 px-3 py-3 text-sm font-semibold', tab === t ? 'border-teal-700 text-teal-800' : 'border-transparent text-muted hover:text-ink')}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Profile & Sharing' ? <ProfileTab onClose={onClose} /> : <BackupTab onClose={onClose} />}
    </Modal>
  );
}

function ProfileTab({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const { rename, signOut } = useSession();
  const toast = useToast();
  const [name, setName] = useState(me.displayName);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return toast('Name must be at least 2 characters', 'error');
    setBusy(true);
    try {
      await rename(name.trim());
      toast('Display name updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast('Workspace link copied');
    } catch {
      toast(`Share this link: ${window.location.origin}`);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ✓ Connected to the Claymont workspace · You are <strong>{me.displayName}</strong>
        </div>
        <label className="mt-5 block">
          <span className="label">Your display name</span>
          <div className="flex gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary shrink-0" onClick={save} disabled={busy || name.trim() === me.displayName}>Save</button>
          </div>
          <span className="mt-1 block text-xs text-muted">Shown next to deals, notes, and activity you create.</span>
        </label>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Share with your team</h3>
        <p className="mt-1 text-sm text-muted">
          Anyone with the link can join — no passwords or invites. Each person types their name on first visit.
          Keep the link private: whoever has it can read and edit every deal.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-accent" onClick={copyLink}><Link2 size={16} /> Copy workspace link</button>
          <button className="btn-secondary" onClick={() => { signOut(); onClose(); }}><LogOut size={16} /> Switch user</button>
        </div>
      </section>
    </div>
  );
}

function BackupTab({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState('');
  const [pendingImport, setPendingImport] = useState<{ name: string; data: unknown } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries();
      toast(success);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const exportJson = async () => {
    try {
      const blob = await api.blob('/workspace/export');
      saveBlob(blob, `claymont-workspace-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error');
    }
  };

  const pickImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport({ name: file.name, data: JSON.parse(await file.text()) });
    } catch {
      toast("That file isn't valid JSON", 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold">Backup</h3>
        <p className="mt-1 text-sm text-muted">
          Export the whole workspace — deals, team, notes, history — as JSON. Uploaded files aren’t included in the export.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button className="btn-secondary h-12" onClick={exportJson}><Download size={16} /> Export workspace JSON</button>
          <button className="btn-secondary h-12" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import workspace JSON</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => pickImport(e.target.files?.[0])} />
        </div>
        {pendingImport && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="text-amber-900">
              Importing <strong>{pendingImport.name}</strong> replaces every deal, note, and team member in this workspace (except you). Export first if you want a copy.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary" onClick={() => setPendingImport(null)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => run(async () => { await api.post('/workspace/import', pendingImport.data); }, 'Workspace imported')}
              >
                Replace workspace
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-line pt-6">
        <h3 className="font-sans text-sm font-bold tracking-[0.08em] text-bad uppercase">Danger zone</h3>
        <p className="mt-1 text-sm text-muted">
          Deletes every deal, document, and team member except you. This cannot be undone. Type <strong>WIPE</strong> to confirm.
        </p>
        <div className="mt-3 flex gap-2">
          <input className="input max-w-[160px]" value={confirmWipe} onChange={(e) => setConfirmWipe(e.target.value)} placeholder="WIPE" aria-label="Type WIPE to confirm" />
          <button
            className="btn-danger"
            disabled={confirmWipe !== 'WIPE' || busy}
            onClick={() => run(async () => { await api.post('/workspace/wipe'); }, 'Workspace wiped')}
          >
            Wipe entire workspace
          </button>
        </div>
      </section>
    </div>
  );
}
