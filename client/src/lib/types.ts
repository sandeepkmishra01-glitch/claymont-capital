export type DealStatus = 'active' | 'won' | 'lost';
export type Priority = 'high' | 'medium' | 'low';

export interface Member {
  id: string;
  displayName: string;
  role: string | null;
  email: string | null;
  avatarColor: string;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface Stage {
  key: string;
  label: string;
  shortLabel: string;
  sortOrder: number;
  colorHex: string;
}

export interface Lookup {
  key: string;
  label: string;
}

export interface Lookups {
  stages: Stage[];
  industries: Lookup[];
  sources: Lookup[];
}

export interface Deal {
  id: string;
  companyName: string;
  legalName: string | null;
  website: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  industryKey: string | null;
  location: string | null;
  description: string | null;
  stageKey: string | null;
  status: DealStatus;
  priority: Priority;
  revenue: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  askingPrice: number | null;
  askingMultiple: number | null;
  sourceKey: string | null;
  dealLeadId: string | null;
  nextAction: string | null;
  nextActionDueDate: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closeReason: string | null;
  assigneeIds: string[];
}

export type DealInput = Partial<Omit<Deal, 'id' | 'ebitdaMargin' | 'createdById' | 'createdAt' | 'updatedAt' | 'closedAt'>>;

export interface StageChange {
  id: string;
  dealId: string;
  fromStageKey: string | null;
  toStageKey: string;
  changedById: string | null;
  changedAt: string;
}

export interface Activity {
  id: string;
  dealId: string | null;
  memberId: string | null;
  actionType: string;
  actionText: string;
  createdAt: string;
}

export interface Note {
  id: string;
  dealId: string;
  memberId: string | null;
  body: string;
  createdAt: string;
}

export interface DocumentMeta {
  id: string;
  dealId: string | null;
  uploaderId: string | null;
  fileName: string;
  storagePath: string | null;
  docType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export const DOC_TYPES = [
  'Teaser', 'CIM', 'NDA', 'IOI', 'LOI', 'Definitive Agreement', 'Financial Model', 'Other',
] as const;

export const ROLES = [
  'Managing Partner', 'Partner', 'Principal', 'Vice President', 'Senior Associate', 'Associate', 'Analyst',
] as const;
