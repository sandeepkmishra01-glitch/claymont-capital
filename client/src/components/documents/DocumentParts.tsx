import { useRef, useState, type DragEvent } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';
import { api, saveBlob } from '../../lib/api';
import { useDeals, useDeleteDocument, useMembers, useUploadDocument } from '../../lib/queries';
import { DOC_TYPES, type DocumentMeta } from '../../lib/types';
import { fileSize, shortDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { useUi } from '../../context/UiContext';

export function DocumentUpload({ dealId }: { dealId?: string }) {
  const deals = useDeals();
  const upload = useUploadDocument();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('CIM');
  const [targetDeal, setTargetDeal] = useState(dealId ?? '');
  const [over, setOver] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const submit = () => {
    if (!file) return;
    upload.mutate(
      { file, docType, dealId: targetDeal },
      {
        onSuccess: () => {
          toast(`Uploaded ${file.name}`);
          setFile(null);
          if (inputRef.current) inputRef.current.value = '';
        },
        onError: (err) => toast(err.message, 'error'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          over ? 'border-teal-500 bg-teal-50' : 'border-line hover:border-teal-500/60',
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Upload size={22} /></span>
        {file ? (
          <p className="text-sm font-semibold text-teal-800">{file.name} <span className="font-normal text-muted">· {fileSize(file.size)}</span></p>
        ) : (
          <>
            <p className="font-semibold text-teal-800">Drop a file here, or click to browse</p>
            <p className="text-sm text-muted">CIMs, teasers, LOIs, models — up to 25 MB</p>
          </>
        )}
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {file && (
        <div className="flex flex-wrap items-end gap-3">
          {!dealId && (
            <label className="min-w-[200px] flex-1">
              <span className="label">Deal</span>
              <select className="input" value={targetDeal} onChange={(e) => setTargetDeal(e.target.value)}>
                <option value="">Not linked to a deal</option>
                {(deals.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.companyName}</option>)}
              </select>
            </label>
          )}
          <label className="min-w-[160px]">
            <span className="label">Type</span>
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <button className="btn-secondary" onClick={() => setFile(null)}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
}

export function DocumentTable({ docs, showDeal = true }: { docs: DocumentMeta[]; showDeal?: boolean }) {
  const members = useMembers();
  const deals = useDeals();
  const remove = useDeleteDocument();
  const toast = useToast();
  const { openDeal } = useUi();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const dealName = new Map((deals.data ?? []).map((d) => [d.id, d.companyName]));

  const download = async (doc: DocumentMeta) => {
    try {
      saveBlob(await api.blob(`/documents/${doc.id}/download`), doc.fileName);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-stone-50 text-left">
            <th className="eyebrow px-5 py-3 sm:px-6">Document</th>
            {showDeal && <th className="eyebrow px-3 py-3">Deal</th>}
            <th className="eyebrow px-3 py-3">Type</th>
            <th className="eyebrow px-3 py-3">Size</th>
            <th className="eyebrow px-3 py-3">Uploaded</th>
            <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {docs.map((doc) => (
            <tr key={doc.id} className="hover:bg-stone-50/60">
              <td className="px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><FileText size={16} /></span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{doc.fileName}</p>
                    <p className="text-xs text-muted">by {members.byId.get(doc.uploaderId ?? '')?.displayName ?? 'Former member'}</p>
                  </div>
                </div>
              </td>
              {showDeal && (
                <td className="px-3 py-3">
                  {doc.dealId ? (
                    <button onClick={() => openDeal(doc.dealId!)} className="text-left font-medium text-teal-800 hover:underline">{dealName.get(doc.dealId)}</button>
                  ) : <span className="text-faint">—</span>}
                </td>
              )}
              <td className="px-3 py-3"><span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">{doc.docType}</span></td>
              <td className="px-3 py-3 whitespace-nowrap text-muted">{fileSize(doc.sizeBytes)}</td>
              <td className="px-3 py-3 whitespace-nowrap text-muted">{shortDate(doc.uploadedAt)}</td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => download(doc)}
                    disabled={!doc.storagePath}
                    title={doc.storagePath ? 'Download' : 'Sample document — no file attached'}
                    className="rounded-md p-1.5 text-muted hover:bg-teal-50 hover:text-teal-800 disabled:opacity-30"
                    aria-label={`Download ${doc.fileName}`}
                  >
                    <Download size={16} />
                  </button>
                  {confirmId === doc.id ? (
                    <>
                      <button
                        onClick={() => remove.mutate(doc.id, {
                          onSuccess: () => toast(`Deleted ${doc.fileName}`),
                          onError: (e) => toast(e.message, 'error'),
                          onSettled: () => setConfirmId(null),
                        })}
                        className="rounded-md bg-bad px-2 py-1 text-xs font-semibold text-white"
                      >
                        Delete
                      </button>
                      <button onClick={() => setConfirmId(null)} className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-stone-100">
                        Keep
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(doc.id)}
                      className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-bad"
                      aria-label={`Delete ${doc.fileName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
