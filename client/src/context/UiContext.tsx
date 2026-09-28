import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UiValue {
  openDealId: string | null;
  openDeal: (id: string) => void;
  closeDeal: () => void;
  newDealOpen: boolean;
  setNewDealOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const [newDealOpen, setNewDealOpen] = useState(false);
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
        newDealOpen, setNewDealOpen,
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
