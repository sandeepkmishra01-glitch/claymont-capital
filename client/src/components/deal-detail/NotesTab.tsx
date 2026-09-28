import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useCreateNote, useDeleteNote, useMembers, useNotes } from '../../lib/queries';
import { shortDate } from '../../lib/format';
import { useMe } from '../../context/SessionContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../shared/Avatar';
import { EmptyState, LoadingBlock } from '../shared/Overlay';

export function NotesTab({ dealId }: { dealId: string }) {
  const me = useMe();
  const notes = useNotes(dealId);
  const members = useMembers();
  const create = useCreateNote(dealId);
  const remove = useDeleteNote(dealId);
  const toast = useToast();
  const [body, setBody] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    create.mutate(body.trim(), {
      onSuccess: () => setBody(''),
      onError: (err) => toast(err.message, 'error'),
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-2">
        <label htmlFor="new-note" className="label">Add a note</label>
        <textarea
          id="new-note"
          className="input min-h-[96px]"
          placeholder="Call notes, diligence findings, next steps…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-faint">Ctrl + Enter to save</span>
          <button className="btn-primary" disabled={!body.trim() || create.isPending}>Save note</button>
        </div>
      </form>

      {notes.isLoading ? <LoadingBlock /> : !notes.data?.length ? <EmptyState title="No notes yet" /> : (
        <ul className="space-y-3">
          {notes.data.map((n) => {
            const author = n.memberId ? members.byId.get(n.memberId) : undefined;
            return (
              <li key={n.id} className="rounded-xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <Avatar member={author} />
                  <span className="text-sm font-semibold text-ink">{author?.displayName ?? 'Former member'}</span>
                  <span className="text-xs text-faint">· {shortDate(n.createdAt)}</span>
                  {n.memberId === me.id && (
                    <button
                      onClick={() => remove.mutate(n.id, { onError: (err) => toast(err.message, 'error') })}
                      className="ml-auto rounded-md p-1 text-faint hover:bg-red-50 hover:text-bad"
                      aria-label="Delete note"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink">{n.body}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
