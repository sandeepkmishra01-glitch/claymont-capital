import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncRoute } from '../lib/http.js';
import { removeFiles } from '../storage/documents.js';

export const dealsRouter = Router();

const dealInclude = { assignees: { select: { memberId: true } } } satisfies Prisma.DealInclude;
type DealRow = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

function serialize({ assignees, ...deal }: DealRow) {
  return {
    ...deal,
    ebitdaMargin: deal.revenue && deal.ebitda != null ? (deal.ebitda / deal.revenue) * 100 : null,
    assigneeIds: assignees.map((a) => a.memberId),
  };
}

const optText = z.string().trim().max(2000).nullish().transform((v) => v || null);
const optNum = z.number().finite().nonnegative().nullish();

const dealSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  legalName: optText,
  website: optText,
  foundedYear: z.number().int().min(1800).max(2100).nullish(),
  employeeCount: z.number().int().nonnegative().nullish(),
  industryKey: optText,
  location: optText,
  description: optText,
  stageKey: z.string().default('sourcing'),
  status: z.enum(['active', 'won', 'lost']).default('active'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  revenue: optNum,
  ebitda: z.number().finite().nullish(),
  askingPrice: optNum,
  askingMultiple: optNum,
  sourceKey: optText,
  dealLeadId: z.string().uuid().nullish(),
  nextAction: optText,
  nextActionDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  closeReason: optText,
  assigneeIds: z.array(z.string().uuid()).optional(),
});

const toDate = (d: string | null | undefined) => (d ? new Date(`${d}T00:00:00Z`) : d === null ? null : undefined);

dealsRouter.get('/', asyncRoute(async (_req, res) => {
  const deals = await prisma.deal.findMany({ include: dealInclude, orderBy: { createdAt: 'desc' } });
  res.json(deals.map(serialize));
}));

dealsRouter.get('/:id', asyncRoute(async (req, res) => {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: req.params.id }, include: dealInclude });
  res.json(serialize(deal));
}));

dealsRouter.post('/', asyncRoute(async (req, res) => {
  const { assigneeIds, nextActionDueDate, ...data } = dealSchema.parse(req.body);
  const me = req.member.id;
  const lead = data.dealLeadId ?? me;
  const deal = await prisma.$transaction(async (tx) => {
    const created = await tx.deal.create({
      data: {
        ...data,
        dealLeadId: lead,
        createdById: me,
        nextActionDueDate: toDate(nextActionDueDate),
        closedAt: data.status === 'active' ? null : new Date(),
        assignees: { create: [...new Set([lead, ...(assigneeIds ?? [])])].map((memberId) => ({ memberId })) },
      },
      include: dealInclude,
    });
    await tx.stageHistory.create({ data: { dealId: created.id, toStageKey: created.stageKey!, changedById: me } });
    await tx.activityLog.create({
      data: { dealId: created.id, memberId: me, actionType: 'deal_created', actionText: 'Added new deal' },
    });
    return created;
  });
  res.status(201).json(serialize(deal));
}));

dealsRouter.patch('/:id', asyncRoute(async (req, res) => {
  const { assigneeIds, nextActionDueDate, ...data } = dealSchema.partial().parse(req.body);
  const me = req.member.id;
  const deal = await prisma.$transaction(async (tx) => {
    const before = await tx.deal.findUniqueOrThrow({ where: { id: req.params.id } });
    const statusChanged = data.status !== undefined && data.status !== before.status;

    if (assigneeIds) {
      await tx.dealAssignee.deleteMany({ where: { dealId: before.id } });
      await tx.dealAssignee.createMany({ data: [...new Set(assigneeIds)].map((memberId) => ({ dealId: before.id, memberId })) });
    }

    const updated = await tx.deal.update({
      where: { id: before.id },
      data: {
        ...data,
        nextActionDueDate: toDate(nextActionDueDate),
        ...(statusChanged ? { closedAt: data.status === 'active' ? null : new Date() } : {}),
      },
      include: { ...dealInclude, stage: true },
    });

    if (data.stageKey && data.stageKey !== before.stageKey) {
      await tx.stageHistory.create({
        data: { dealId: before.id, fromStageKey: before.stageKey, toStageKey: data.stageKey, changedById: me },
      });
      await tx.activityLog.create({
        data: { dealId: before.id, memberId: me, actionType: 'stage_changed', actionText: `Moved to ${updated.stage?.label}` },
      });
    }
    if (statusChanged) {
      const text = data.status === 'won' ? 'Marked as Won — deal closed'
        : data.status === 'lost' ? `Marked as Passed${updated.closeReason ? ` — ${updated.closeReason}` : ''}`
        : 'Reopened deal';
      await tx.activityLog.create({ data: { dealId: before.id, memberId: me, actionType: 'deal_closed', actionText: text } });
    }
    const { stage: _stage, ...rest } = updated;
    return rest;
  });
  res.json(serialize(deal));
}));

dealsRouter.delete('/:id', asyncRoute(async (req, res) => {
  const docs = await prisma.document.findMany({ where: { dealId: req.params.id }, select: { storagePath: true } });
  await prisma.deal.delete({ where: { id: req.params.id } });
  await removeFiles(docs.map((d) => d.storagePath));
  res.status(204).end();
}));
