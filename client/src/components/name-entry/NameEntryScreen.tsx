import { useState, type FormEvent } from 'react';
import { useSession } from '../../context/SessionContext';
import { LogoMark } from '../layout/Logo';

export function NameEntryScreen() {
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Enter at least 2 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-800">
          <LogoMark size={34} />
        </div>
        <h1 className="text-3xl font-semibold">Welcome to Claymont</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your name so we can attribute your deal edits, notes, and activity. You can change it any time in Settings.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          aria-label="Your full name"
          maxLength={80}
          className="input mt-6 h-12 text-center text-base"
        />
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-4 h-12 w-full text-base">
          {busy ? 'Signing in…' : 'Continue →'}
        </button>
        <p className="mt-4 text-xs text-faint">
          No password required. Using a teammate’s exact name signs you in as them.
        </p>
      </form>
    </div>
  );
}
