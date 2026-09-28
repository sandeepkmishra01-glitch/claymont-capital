import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Globe, Sparkles, Upload } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../lib/api';
import { extractionToDealInput, type AutoFillResult, type Extraction } from '../../lib/autofill';
import { fileSize } from '../../lib/format';
import { Modal } from '../shared/Overlay';

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = '.pdf,.xlsx,.docx,.txt,.md,.csv,.tsv';

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get<{ configured: boolean }>('/ai/status'),
    staleTime: 60_000,
  });
}

interface Props {
  title?: string;
  allowUrl?: boolean;
  onClose: () => void;
  onResult: (result: AutoFillResult) => void;
}

export function AutoFillModal({ title = 'Auto-fill with Claude', allowUrl = true, onClose, onResult }: Props) {
  const status = useAiStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_BYTES) return setError(`That file is ${fileSize(f.size)} — the limit for analysis is 20 MB.`);
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files[0]);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const form = new FormData();
    if (mode === 'file') {
      if (!file) return setError('Choose a document first.');
      form.append('file', file);
    } else {
      if (!url.trim()) return setError('Paste a company website URL.');
      form.append('url', url.trim());
    }
    setBusy(true);
    setError(null);
    try {
      const extraction = await api.post<Extraction>('/ai/extract', form);
      const prefill = extractionToDealInput(extraction);
      if (Object.keys(prefill).length === 0) {
        setError("Claude couldn't find deal information in that source. Try a CIM or teaser.");
        setBusy(false);
        return;
      }
      onResult({ prefill, file: mode === 'file' ? file ?? undefined : undefined, financialPeriod: extraction.financialPeriod });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-fill failed');
      setBusy(false);
    }
  };

  const notConfigured = status.data && !status.data.configured;

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-accent" onClick={() => submit()} disabled={busy || !!notConfigured}>
            <Sparkles size={16} /> {busy ? 'Analyzing…' : 'Extract deal data'}
          </button>
        </>
      }
    >
      {notConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          AI auto-fill isn’t set up yet. Add an <code className="font-mono">ANTHROPIC_API_KEY</code> environment variable to the server, then redeploy.
        </div>
      ) : busy ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center" aria-live="polite">
          <Sparkles size={28} className="animate-pulse text-amber-accent" />
          <p className="font-semibold text-teal-800">Claude is reading {mode === 'file' ? file?.name : 'the website'}…</p>
          <p className="max-w-sm text-sm text-muted">Long CIMs can take a minute. You’ll review every field before anything is saved.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Claude pulls the company profile, financials, asking terms, highlights, and risks into the deal form. Nothing is saved until you review it.
          </p>
          {allowUrl && (
            <div className="flex gap-1 rounded-lg bg-stone-100 p-1" role="tablist">
              {([['file', 'Upload document', FileText], ['url', 'Company website', Globe]] as const).map(([m, label, Icon]) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={clsx('flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold', mode === m ? 'bg-white text-teal-800 shadow-sm' : 'text-muted')}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          )}
          {mode === 'file' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              className={clsx(
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                over ? 'border-amber-accent bg-amber-soft' : 'border-line hover:border-amber-accent/60',
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber-accent"><Upload size={22} /></span>
              {file ? (
                <p className="text-sm font-semibold text-teal-800">{file.name} <span className="font-normal text-muted">· {fileSize(file.size)}</span></p>
              ) : (
                <>
                  <p className="font-semibold text-teal-800">Drop a CIM, teaser, or model</p>
                  <p className="text-sm text-muted">PDF, Excel, Word, or text · up to 20 MB</p>
                </>
              )}
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </div>
          ) : (
            <label className="block">
              <span className="label">Company website</span>
              <input autoFocus className="input" placeholder="https://www.example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
              <span className="mt-1 block text-xs text-muted">Websites rarely list financials — expect the profile, not the numbers.</span>
            </label>
          )}
          {error && <p className="text-sm text-bad">{error}</p>}
        </form>
      )}
    </Modal>
  );
}
