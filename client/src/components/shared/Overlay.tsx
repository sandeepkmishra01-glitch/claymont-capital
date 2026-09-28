import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const openOverlays: symbol[] = [];

function useOverlayBehavior(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol('overlay');
    openOverlays.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openOverlays[openOverlays.length - 1] === id) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const autofocus = panelRef.current?.querySelector<HTMLElement>('[autofocus], input, textarea, select');
    (autofocus ?? panelRef.current)?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      openOverlays.splice(openOverlays.indexOf(id), 1);
      document.removeEventListener('keydown', onKey);
      if (openOverlays.length === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, []);
  return panelRef;
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

export function Modal({ title, onClose, children, footer, width = 'md' }: ModalProps) {
  const panelRef = useOverlayBehavior(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-teal-950/40 p-4 backdrop-blur-[2px] sm:items-center" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={clsx('card my-8 flex max-h-[calc(100vh-4rem)] w-full flex-col shadow-2xl', width === 'md' ? 'max-w-lg' : 'max-w-3xl')}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-stone-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function SlideOver({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useOverlayBehavior(onClose);
  return (
    <div className="fixed inset-0 z-40 bg-teal-950/30" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="font-serif text-lg text-teal-800">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className }: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={clsx('card overflow-hidden', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-3 p-6" aria-busy="true">
      {[0, 1, 2].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-stone-100" style={{ width: `${90 - i * 15}%` }} />)}
    </div>
  );
}
