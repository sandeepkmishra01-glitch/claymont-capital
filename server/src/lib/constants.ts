export const STAGES = [
  { key: 'sourcing', label: 'Sourcing', shortLabel: 'Sourcing', colorHex: '#9ca3af' },
  { key: 'initial_review', label: 'Initial Review', shortLabel: 'Review', colorHex: '#3b82f6' },
  { key: 'nda_signed', label: 'NDA Signed', shortLabel: 'NDA', colorHex: '#8b5cf6' },
  { key: 'ioi_submitted', label: 'IOI Submitted', shortLabel: 'IOI', colorHex: '#f59e0b' },
  { key: 'mgmt_meeting', label: 'Mgmt Meeting', shortLabel: 'Meeting', colorHex: '#0d9488' },
  { key: 'loi_submitted', label: 'LOI Submitted', shortLabel: 'LOI', colorHex: '#f97316' },
  { key: 'due_diligence', label: 'Due Diligence', shortLabel: 'DD', colorHex: '#7d8b3e' },
  { key: 'definitive_agreement', label: 'Definitive Agmt', shortLabel: 'Close', colorHex: '#22c55e' },
] as const;

export const INDUSTRIES = [
  { key: 'healthcare_services', label: 'Healthcare Services' },
  { key: 'diagnostics_life_sciences', label: 'Diagnostics & Life Sciences' },
  { key: 'industrial_manufacturing', label: 'Industrial & Manufacturing' },
  { key: 'business_facilities_services', label: 'Business & Facilities Services' },
  { key: 'environmental_services', label: 'Environmental Services' },
  { key: 'logistics_transportation', label: 'Logistics & Transportation' },
  { key: 'software_technology', label: 'Software & Technology' },
  { key: 'specialty_food_consumer', label: 'Specialty Food & Consumer' },
  { key: 'staffing_workforce', label: 'Staffing & Workforce Solutions' },
  { key: 'other', label: 'Other' },
] as const;

export const SOURCES = [
  { key: 'investment_banker', label: 'Investment Banker' },
  { key: 'business_broker', label: 'Business Broker' },
  { key: 'direct_outreach', label: 'Direct Outreach' },
  { key: 'inbound_website', label: 'Inbound (Website)' },
  { key: 'industry_conference', label: 'Industry Conference' },
  { key: 'referral_operating_partner', label: 'Referral - Operating Partner' },
  { key: 'proprietary_sourcing', label: 'Proprietary Sourcing' },
  { key: 'family_office_network', label: 'Family Office Network' },
] as const;

export const DOC_TYPES = [
  'Teaser',
  'CIM',
  'NDA',
  'IOI',
  'LOI',
  'Definitive Agreement',
  'Financial Model',
  'Other',
] as const;

const AVATAR_PALETTE = [
  '#1a4d4d', '#2d7a7a', '#8b5e3c', '#b45309', '#6d28d9',
  '#1d4ed8', '#be123c', '#4d7c0f', '#0f766e', '#7c2d12',
];

export function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
