import { BarChart3, Building2, Compass, FileText, KanbanSquare, LayoutGrid, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { path: '/', label: 'Dashboard', subtitle: 'Overview of all active engagements', icon: LayoutGrid },
  { path: '/pipeline', label: 'Pipeline', subtitle: 'Drag-and-drop deal stages', icon: KanbanSquare },
  { path: '/sourcing', label: 'Sourcing', subtitle: 'Track origination channels and lead sources', icon: Compass },
  { path: '/industries', label: 'Industries', subtitle: 'Sector coverage and pipeline distribution', icon: Building2 },
  { path: '/analytics', label: 'Analytics', subtitle: 'Performance metrics and conversion analysis', icon: BarChart3 },
  { path: '/documents', label: 'Documents', subtitle: 'All deal documents in one library', icon: FileText },
  { path: '/team', label: 'Team', subtitle: 'Members, roles, and workload distribution', icon: Users },
];
