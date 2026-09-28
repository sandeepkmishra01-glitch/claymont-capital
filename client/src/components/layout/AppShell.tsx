import { Outlet, useLocation } from 'react-router-dom';
import { Plus, Settings, Sparkles } from 'lucide-react';
import { AutoFillModal } from '../autofill/AutoFillModal';
import { NAV } from './nav';
import { Sidebar, MobileNav } from './Sidebar';
import { SearchBox } from './SearchBox';
import { useMe } from '../../context/SessionContext';
import { useUi } from '../../context/UiContext';
import { DealDetailPanel } from '../deal-detail/DealDetailPanel';
import { NewDealModal } from '../new-deal/NewDealModal';
import { SettingsModal } from '../settings/SettingsModal';

export function AppShell() {
  const { pathname } = useLocation();
  const page = NAV.find((n) => n.path === pathname) ?? NAV[0]!;
  const me = useMe();
  const {
    openDealId, closeDeal, newDealDraft, openNewDeal, closeNewDeal,
    autoFillOpen, setAutoFillOpen, settingsOpen, setSettingsOpen,
  } = useUi();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-8">
            <div className="mr-auto min-w-0">
              <h1 className="text-3xl leading-tight font-semibold">{page.label}</h1>
              <p className="text-sm text-muted">{page.subtitle}</p>
            </div>
            <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1 lg:max-w-md">
              <SearchBox />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex" title="Signed in">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live · {me.displayName}
              </span>
              <button onClick={() => setSettingsOpen(true)} className="btn-secondary h-10 w-10 !p-0" aria-label="Settings">
                <Settings size={18} />
              </button>
              <button onClick={() => setAutoFillOpen(true)} className="btn-accent h-10" title="Auto-fill a deal from a CIM, teaser, or website with Claude">
                <Sparkles size={16} /> <span className="hidden sm:inline">Auto-Fill</span>
              </button>
              <button onClick={() => openNewDeal()} className="btn-primary h-10">
                <Plus size={16} strokeWidth={2.5} /> New Deal
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      {openDealId && <DealDetailPanel dealId={openDealId} onClose={closeDeal} />}
      {newDealDraft && <NewDealModal draft={newDealDraft === 'blank' ? undefined : newDealDraft} onClose={closeNewDeal} />}
      {autoFillOpen && (
        <AutoFillModal
          onClose={() => setAutoFillOpen(false)}
          onResult={(result) => {
            setAutoFillOpen(false);
            openNewDeal(result);
          }}
        />
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
