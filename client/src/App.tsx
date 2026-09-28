import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './context/SessionContext';
import { UiProvider } from './context/UiContext';
import { AppShell } from './components/layout/AppShell';
import { NameEntryScreen } from './components/name-entry/NameEntryScreen';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { PipelinePage } from './components/pipeline/PipelinePage';
import { SourcingPage } from './components/sourcing/SourcingPage';
import { IndustriesPage } from './components/industries/IndustriesPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { TeamPage } from './components/team/TeamPage';
import { LoadingBlock } from './components/shared/Overlay';

const AnalyticsPage = lazy(() => import('./components/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));

export function App() {
  const { status } = useSession();

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-teal-800 text-white/70">Loading workspace…</div>;
  }
  if (status === 'signed-out') return <NameEntryScreen />;

  return (
    <UiProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="sourcing" element={<SourcingPage />} />
          <Route path="industries" element={<IndustriesPage />} />
          <Route path="analytics" element={<Suspense fallback={<LoadingBlock />}><AnalyticsPage /></Suspense>} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UiProvider>
  );
}
