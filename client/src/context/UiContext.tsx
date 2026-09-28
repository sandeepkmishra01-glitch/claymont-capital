import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AutoFillResult } from '../lib/autofill';

interface UiValue {
  openDealId: string | null;
  openDeal: (id: string) => void;
  closeDeal: () => void;
  newDealDraft: AutoFillResult | 'blank' | null;
  openNewDeal: (draft?: AutoFillResult) => void;
  closeNewDeal: () => void;
  autoFillOpen: boolean;
  setAutoFillOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const [newDealDraft, setNewDealDraft] = useState<AutoFillResult | 'blank' | null>(null);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openDeal = useCallback((id: string) => {
    setParams((p) => {
      p.set('deal', id);
      return p;
    });
  }, [setParams]);

  const closeDeal = useCallback(() => {
    setParams((p) => {
      p.delete('deal');
      return p;
    });
  }, [setParams]);

  return (
    <UiContext.Provider
      value={{
        openDealId: params.get('deal'),
        openDeal, closeDeal,
        newDealDraft,
        openNewDeal: (draft) => setNewDealDraft(draft ?? 'blank'),
        closeNewDeal: () => setNewDealDraft(null),
        autoFillOpen, setAutoFillOpen,
        settingsOpen, setSettingsOpen,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside UiProvider');
  return ctx;
}
