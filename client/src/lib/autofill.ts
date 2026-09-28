import type { DealInput } from './types';

export interface Extraction {
  companyName: string | null;
  legalName: string | null;
  website: string | null;
  industryKey: string | null;
  location: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  description: string | null;
  revenueUsd: number | null;
  ebitdaUsd: number | null;
  financialPeriod: string | null;
  askingPriceUsd: number | null;
  askingMultiple: number | null;
  investmentHighlights: string[];
  keyRisks: string[];
}

export interface AutoFillResult {
  prefill: DealInput;
  file?: File;
  financialPeriod: string | null;
}

function profileText(x: Extraction): string | null {
  const parts = [x.description?.trim()].filter(Boolean) as string[];
  if (x.investmentHighlights.length) parts.push(`Highlights:\n${x.investmentHighlights.map((h) => `• ${h}`).join('\n')}`);
  if (x.keyRisks.length) parts.push(`Key risks:\n${x.keyRisks.map((r) => `• ${r}`).join('\n')}`);
  return parts.length ? parts.join('\n\n') : null;
}

/** Only fields Claude actually found — null means "not in the source", so it must not overwrite existing data. */
export function extractionToDealInput(x: Extraction): DealInput {
  const multiple = x.askingMultiple ?? (x.askingPriceUsd && x.ebitdaUsd ? +(x.askingPriceUsd / x.ebitdaUsd).toFixed(1) : null);
  const entries: [keyof DealInput, unknown][] = [
    ['companyName', x.companyName],
    ['legalName', x.legalName],
    ['website', x.website],
    ['industryKey', x.industryKey],
    ['location', x.location],
    ['foundedYear', x.foundedYear],
    ['employeeCount', x.employeeCount],
    ['description', profileText(x)],
    ['revenue', x.revenueUsd],
    ['ebitda', x.ebitdaUsd],
    ['askingPrice', x.askingPriceUsd],
    ['askingMultiple', multiple],
  ];
  return Object.fromEntries(entries.filter(([, v]) => v != null && v !== '')) as DealInput;
}

export function guessDocType(fileName: string): string {
  const n = fileName.toLowerCase();
  if (n.includes('teaser')) return 'Teaser';
  if (n.includes('loi')) return 'LOI';
  if (n.includes('ioi')) return 'IOI';
  if (n.includes('nda')) return 'NDA';
  if (n.endsWith('.xlsx') || n.includes('model')) return 'Financial Model';
  return 'CIM';
}
