import 'dotenv/config';
import { PrismaClient, DealStatus, Priority } from '@prisma/client';
import { STAGES, INDUSTRIES, SOURCES, avatarColorFor } from '../src/lib/constants.js';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);
const M = 1_000_000;

const TEAM = [
  { name: 'Marcus Wilson', role: 'Managing Partner' },
  { name: 'Leena Patel', role: 'Partner' },
  { name: 'David Kim', role: 'Partner' },
  { name: 'James Cooper', role: 'Principal' },
  { name: 'Rachel Ortiz', role: 'Principal' },
  { name: 'Sofia Sanchez', role: 'Vice President' },
  { name: 'Andrew Blake', role: 'Vice President' },
  { name: 'Priya Nair', role: 'Senior Associate' },
  { name: 'Tom Bradley', role: 'Associate' },
  { name: 'Emily Chen', role: 'Analyst' },
];

type SeedDeal = {
  company: string;
  legal: string;
  industry: string;
  stage: string;
  status: DealStatus;
  priority: Priority;
  revenue: number;
  ebitda: number;
  multiple: number;
  source: string;
  lead: string;
  others: string[];
  location: string;
  founded: number;
  employees: number;
  website: string;
  description: string;
  nextAction?: string;
  dueInDays?: number;
  closeReason?: string;
};

// Mirrors the reference site's demo pipeline: 10 active deals (one per stage, two in the
// first two stages), Pinegrove passed, plus two extra closed deals so Win Rate is non-trivial.
const DEALS: SeedDeal[] = [
  {
    company: 'TruePoint Diagnostics', legal: 'TruePoint Diagnostics, Inc.',
    industry: 'diagnostics_life_sciences', stage: 'sourcing', status: 'active', priority: 'low',
    revenue: 5.3 * M, ebitda: 0.98 * M, multiple: 6.5, source: 'investment_banker',
    lead: 'Andrew Blake', others: [], location: 'Tampa, FL', founded: 2014, employees: 38,
    website: 'https://www.truepointdx.example',
    description: 'Independent regional medical lab focused on toxicology and clinical chemistry, with contracts across PT/SUD recovery networks.',
    nextAction: 'Send teaser request', dueInDays: 3,
  },
  {
    company: 'Greenfield Equipment Rental', legal: 'Greenfield Equipment Rental, LLC',
    industry: 'industrial_manufacturing', stage: 'sourcing', status: 'active', priority: 'medium',
    revenue: 7.8 * M, ebitda: 1.4 * M, multiple: 5.8, source: 'proprietary_sourcing',
    lead: 'Leena Patel', others: ['Andrew Blake'], location: 'Denver, CO', founded: 2001, employees: 75,
    website: 'https://www.greenfieldrental.example',
    description: 'Aerial and earthmoving equipment rental with three branches along the Front Range.',
    nextAction: 'NDA out', dueInDays: 5,
  },
  {
    company: 'Meridian Facilities Services', legal: 'Meridian Facilities Services Corp.',
    industry: 'business_facilities_services', stage: 'initial_review', status: 'active', priority: 'medium',
    revenue: 9.8 * M, ebitda: 1.4 * M, multiple: 5.2, source: 'industry_conference',
    lead: 'Sofia Sanchez', others: ['Tom Bradley', 'Emily Chen'], location: 'Charlotte, NC', founded: 2004, employees: 185,
    website: 'https://www.meridianfs.example',
    description: 'Janitorial and integrated facilities maintenance for Class A office and healthcare campuses in the Carolinas.',
    nextAction: 'Initial financials review', dueInDays: 13,
  },
  {
    company: 'Crestmark Industrial Supply', legal: 'Crestmark Industrial Supply Co.',
    industry: 'industrial_manufacturing', stage: 'initial_review', status: 'active', priority: 'medium',
    revenue: 15.9 * M, ebitda: 2.3 * M, multiple: 5.0, source: 'referral_operating_partner',
    lead: 'Marcus Wilson', others: ['David Kim'], location: 'Cleveland, OH', founded: 1988, employees: 120,
    website: 'https://www.crestmarksupply.example',
    description: 'MRO and industrial consumables distributor serving manufacturers across Ohio and western Pennsylvania.',
    nextAction: 'Schedule management call', dueInDays: 12,
  },
  {
    company: 'BrightLeaf Specialty Foods', legal: 'BrightLeaf Specialty Foods, LLC',
    industry: 'specialty_food_consumer', stage: 'nda_signed', status: 'active', priority: 'low',
    revenue: 6.1 * M, ebitda: 0.85 * M, multiple: 4.8, source: 'inbound_website',
    lead: 'Leena Patel', others: ['Rachel Ortiz'], location: 'Asheville, NC', founded: 2012, employees: 64,
    website: 'https://www.brightleaffoods.example',
    description: 'Premium small-batch sauces and condiments sold through natural grocery and regional specialty retail.',
    nextAction: 'Request CIM from broker', dueInDays: 14,
  },
  {
    company: 'Sunridge Commercial Roofing', legal: 'Sunridge Commercial Roofing, Inc.',
    industry: 'business_facilities_services', stage: 'ioi_submitted', status: 'active', priority: 'medium',
    revenue: 19 * M, ebitda: 3.2 * M, multiple: 4.9, source: 'family_office_network',
    lead: 'Rachel Ortiz', others: ['Priya Nair'], location: 'Dallas, TX', founded: 1997, employees: 150,
    website: 'https://www.sunridgeroofing.example',
    description: 'Commercial re-roofing and maintenance contractor with a recurring service-agreement book across DFW.',
    nextAction: 'IOI response from seller', dueInDays: 4,
  },
  {
    company: 'Caldera Logistics Group', legal: 'Caldera Logistics Group, LLC',
    industry: 'logistics_transportation', stage: 'mgmt_meeting', status: 'active', priority: 'medium',
    revenue: 40 * M, ebitda: 3.2 * M, multiple: 5.5, source: 'direct_outreach',
    lead: 'Marcus Wilson', others: ['Tom Bradley'], location: 'Phoenix, AZ', founded: 2006, employees: 210,
    website: 'https://www.calderalogistics.example',
    description: 'Regional third-party logistics provider offering dedicated trucking and cross-dock warehousing across the Southwest.',
    nextAction: 'Site visit — Phoenix cross-dock', dueInDays: 18,
  },
  {
    company: 'Northbrook Home Health', legal: 'Northbrook Home Health Services, Inc.',
    industry: 'healthcare_services', stage: 'loi_submitted', status: 'active', priority: 'high',
    revenue: 9.5 * M, ebitda: 1.6 * M, multiple: 6.0, source: 'investment_banker',
    lead: 'Leena Patel', others: ['Sofia Sanchez', 'Priya Nair'], location: 'Chicago, IL', founded: 2009, employees: 140,
    website: 'https://www.northbrookhh.example',
    description: 'Medicare-certified home health and hospice agency serving the Chicago suburbs with skilled nursing and therapy.',
    nextAction: 'LOI counter response', dueInDays: 11,
  },
  {
    company: 'Apex Industrial Coatings', legal: 'Apex Industrial Coatings, Inc.',
    industry: 'industrial_manufacturing', stage: 'due_diligence', status: 'active', priority: 'high',
    revenue: 16 * M, ebitda: 3.1 * M, multiple: 6.2, source: 'business_broker',
    lead: 'James Cooper', others: ['Sofia Sanchez', 'Tom Bradley'], location: 'Milwaukee, WI', founded: 1993, employees: 95,
    website: 'https://www.apexcoatings.example',
    description: 'Powder coating and specialty finishing for OEM agricultural and heavy-equipment manufacturers.',
    nextAction: 'Environmental Phase I review', dueInDays: 8,
  },
  {
    company: 'Riverbend Environmental', legal: 'Riverbend Environmental Services, LLC',
    industry: 'environmental_services', stage: 'definitive_agreement', status: 'active', priority: 'high',
    revenue: 14.5 * M, ebitda: 2.7 * M, multiple: 6.8, source: 'business_broker',
    lead: 'Marcus Wilson', others: ['Sofia Sanchez', 'Rachel Ortiz'], location: 'Baton Rouge, LA', founded: 2003, employees: 160,
    website: 'https://www.riverbendenv.example',
    description: 'Industrial wastewater treatment, remediation, and emergency spill response across the Gulf Coast.',
    nextAction: 'Final SPA markup to counsel', dueInDays: 10,
  },
  {
    company: 'Pinegrove Software Services', legal: 'Pinegrove Software Services, Inc.',
    industry: 'software_technology', stage: 'initial_review', status: 'lost', priority: 'low',
    revenue: 11 * M, ebitda: 2.9 * M, multiple: 7.5, source: 'inbound_website',
    lead: 'James Cooper', others: ['Emily Chen'], location: 'Austin, TX', founded: 2011, employees: 72,
    website: 'https://www.pinegrovesoftware.example',
    description: 'Managed IT services and vertical software for regional credit unions and community banks.',
    closeReason: 'fit issues',
  },
  {
    company: 'Ashford Metal Fabricators', legal: 'Ashford Metal Fabricators, Inc.',
    industry: 'industrial_manufacturing', stage: 'definitive_agreement', status: 'won', priority: 'medium',
    revenue: 25 * M, ebitda: 5 * M, multiple: 6.0, source: 'investment_banker',
    lead: 'David Kim', others: ['Andrew Blake'], location: 'Greenville, SC', founded: 1985, employees: 210,
    website: 'https://www.ashfordmetal.example',
    description: 'Precision sheet-metal fabrication and assembly for HVAC and electrical-equipment OEMs.',
  },
  {
    company: 'Delcorp Staffing Solutions', legal: 'Delcorp Staffing Solutions, LLC',
    industry: 'staffing_workforce', stage: 'ioi_submitted', status: 'lost', priority: 'low',
    revenue: 13 * M, ebitda: 2.1 * M, multiple: 4.5, source: 'business_broker',
    lead: 'Rachel Ortiz', others: [], location: 'Atlanta, GA', founded: 2008, employees: 45,
    website: 'https://www.delcorpstaffing.example',
    description: 'Light-industrial and warehouse staffing across metro Atlanta distribution centers.',
    closeReason: 'seller accepted a strategic offer above our range',
  },
];

// Metadata-only demo documents: there is no file behind them, so downloads return 404.
const DOCS: { deal: string; file: string; type: string; kb: number; by: string; ago: number }[] = [
  { deal: 'Riverbend Environmental', file: 'Riverbend_DefAgmt_Draft_v5.docx', type: 'Definitive Agreement', kb: 210, by: 'Sofia Sanchez', ago: 2 },
  { deal: 'Meridian Facilities Services', file: 'Meridian_Overview.pdf', type: 'Teaser', kb: 320, by: 'Tom Bradley', ago: 7 },
  { deal: 'Northbrook Home Health', file: 'LOI_Draft_v3.docx', type: 'LOI', kb: 95, by: 'Sofia Sanchez', ago: 12 },
  { deal: 'Northbrook Home Health', file: 'Northbrook_Financial_Model.xlsx', type: 'Financial Model', kb: 880, by: 'Sofia Sanchez', ago: 12 },
  { deal: 'Crestmark Industrial Supply', file: 'Crestmark_Teaser.pdf', type: 'Teaser', kb: 410, by: 'David Kim', ago: 13 },
  { deal: 'BrightLeaf Specialty Foods', file: 'BrightLeaf_Teaser.pdf', type: 'Teaser', kb: 290, by: 'Rachel Ortiz', ago: 23 },
  { deal: 'Apex Industrial Coatings', file: 'Apex_CIM_2026.pdf', type: 'CIM', kb: 4200, by: 'James Cooper', ago: 30 },
  { deal: 'Apex Industrial Coatings', file: 'Apex_Financial_Model_v2.xlsx', type: 'Financial Model', kb: 1350, by: 'Sofia Sanchez', ago: 21 },
  { deal: 'Sunridge Commercial Roofing', file: 'Sunridge_IOI.pdf', type: 'IOI', kb: 120, by: 'Priya Nair', ago: 9 },
  { deal: 'Caldera Logistics Group', file: 'Caldera_CIM.pdf', type: 'CIM', kb: 3600, by: 'Tom Bradley', ago: 18 },
];

const NOTES: { deal: string; by: string; body: string; ago: number }[] = [
  { deal: 'Apex Industrial Coatings', by: 'James Cooper', ago: 16, body: 'Mgmt meeting with CEO Bill Vance and CFO. Customer concentration lower than CIM implied — top 5 = 38% of revenue.' },
  { deal: 'Riverbend Environmental', by: 'Marcus Wilson', ago: 5, body: 'Seller wants to close before year-end. Working capital peg still open; counsel flagging indemnity cap.' },
  { deal: 'Northbrook Home Health', by: 'Leena Patel', ago: 8, body: 'Strong clinical outcomes; reimbursement risk from PDGM changes worth modeling in the downside case.' },
  { deal: 'TruePoint Diagnostics', by: 'Andrew Blake', ago: 2, body: 'Banker says process launches in ~3 weeks. Ask for early look at payor mix.' },
];

async function seedLookups() {
  for (const [i, s] of STAGES.entries()) {
    const data = { label: s.label, shortLabel: s.shortLabel, sortOrder: i, colorHex: s.colorHex };
    await prisma.stage.upsert({ where: { key: s.key }, update: data, create: { key: s.key, ...data } });
  }
  for (const ind of INDUSTRIES) {
    await prisma.industry.upsert({ where: { key: ind.key }, update: { label: ind.label }, create: ind });
  }
  for (const src of SOURCES) {
    await prisma.source.upsert({ where: { key: src.key }, update: { label: src.label }, create: src });
  }
}

async function seedDemoData() {
  const members = new Map<string, string>();
  for (const t of TEAM) {
    const [first, last] = t.name.toLowerCase().split(' ');
    const m = await prisma.member.create({
      data: {
        displayName: t.name,
        role: t.role,
        email: `${first[0]}${last}@claymontpartners.com`,
        avatarColor: avatarColorFor(t.name),
        createdAt: daysAgo(400),
      },
    });
    members.set(t.name, m.id);
  }

  const stageIndex = new Map<string, number>(STAGES.map((s, i) => [s.key, i]));
  const stageLabel = new Map<string, string>(STAGES.map((s) => [s.key, s.label]));
  const dealIds = new Map<string, string>();

  for (const [dIdx, d] of DEALS.entries()) {
    const target = stageIndex.get(d.stage)!;
    const step = 9 + (dIdx % 4) * 2;
    const closedAgo = d.status === 'won' ? 20 : d.status === 'lost' ? 30 + dIdx : 0;
    const createdAgo = closedAgo + (target + 1) * step + (dIdx % 3);
    const leadId = members.get(d.lead)!;

    const deal = await prisma.deal.create({
      data: {
        companyName: d.company,
        legalName: d.legal,
        website: d.website,
        foundedYear: d.founded,
        employeeCount: d.employees,
        industryKey: d.industry,
        location: d.location,
        description: d.description,
        stageKey: d.stage,
        status: d.status,
        priority: d.priority,
        revenue: d.revenue,
        ebitda: d.ebitda,
        askingMultiple: d.multiple,
        askingPrice: Math.round(d.ebitda * d.multiple),
        sourceKey: d.source,
        dealLeadId: leadId,
        nextAction: d.nextAction,
        nextActionDueDate: d.dueInDays !== undefined ? daysFromNow(d.dueInDays) : null,
        createdById: leadId,
        createdAt: daysAgo(createdAgo),
        closedAt: closedAgo ? daysAgo(closedAgo) : null,
        closeReason: d.closeReason,
        assignees: { create: [d.lead, ...d.others].map((n) => ({ memberId: members.get(n)! })) },
      },
    });
    dealIds.set(d.company, deal.id);

    await prisma.activityLog.create({
      data: {
        dealId: deal.id, memberId: leadId, actionType: 'deal_created',
        actionText: 'Added new deal', createdAt: daysAgo(createdAgo),
      },
    });

    let prev: string | null = null;
    for (let i = 0; i <= target; i++) {
      const key = STAGES[i].key;
      const at = daysAgo(createdAgo - i * step);
      const actor = i % 2 === 0 ? leadId : members.get(d.others[0] ?? d.lead)!;
      await prisma.stageHistory.create({
        data: { dealId: deal.id, fromStageKey: prev, toStageKey: key, changedById: actor, changedAt: at },
      });
      if (prev) {
        await prisma.activityLog.create({
          data: {
            dealId: deal.id, memberId: actor, actionType: 'stage_changed',
            actionText: `Moved to ${stageLabel.get(key)}`, createdAt: at,
          },
        });
      }
      prev = key;
    }

    if (d.status !== 'active') {
      await prisma.activityLog.create({
        data: {
          dealId: deal.id, memberId: leadId, actionType: 'deal_closed',
          actionText: d.status === 'won' ? 'Marked as Won — deal closed' : `Marked as Passed — ${d.closeReason}`,
          createdAt: daysAgo(closedAgo),
        },
      });
    }
  }

  for (const doc of DOCS) {
    const uploaderId = members.get(doc.by)!;
    const dealId = dealIds.get(doc.deal)!;
    await prisma.document.create({
      data: { dealId, uploaderId, fileName: doc.file, docType: doc.type, sizeBytes: doc.kb * 1024, uploadedAt: daysAgo(doc.ago) },
    });
    await prisma.activityLog.create({
      data: {
        dealId, memberId: uploaderId, actionType: 'document_uploaded',
        actionText: `Uploaded ${doc.file}`, createdAt: daysAgo(doc.ago),
      },
    });
  }

  for (const n of NOTES) {
    const memberId = members.get(n.by)!;
    const dealId = dealIds.get(n.deal)!;
    await prisma.note.create({ data: { dealId, memberId, body: n.body, createdAt: daysAgo(n.ago) } });
    await prisma.activityLog.create({
      data: { dealId, memberId, actionType: 'note_added', actionText: 'Added a note', createdAt: daysAgo(n.ago) },
    });
  }
}

async function main() {
  await seedLookups();
  const existing = await prisma.deal.count();
  if (existing > 0) {
    console.log(`Lookups refreshed; ${existing} deals already present, skipping demo data.`);
    return;
  }
  await seedDemoData();
  console.log('Seeded demo workspace.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
