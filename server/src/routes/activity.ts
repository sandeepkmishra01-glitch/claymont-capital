import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncRoute } from '../lib/http.js';

export const activityRouter = Router();

activityRouter.get('/activity', asyncRoute(async (req, res) => {
  const { dealId, limit } = z.object({
    dealId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(50),
  }).parse(req.query);
  res.json(await prisma.activityLog.findMany({
    where: dealId ? { dealId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  }));
}));

activityRouter.get('/stage-history', asyncRoute(async (_req, res) => {
  res.json(await prisma.stageHistory.findMany({ orderBy: { changedAt: 'asc' } }));
}));

activityRouter.get('/lookups', asyncRoute(async (_req, res) => {
  const [stages, industries, sources] = await Promise.all([
    prisma.stage.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.industry.findMany(),
    prisma.source.findMany(),
  ]);
  res.json({ stages, industries, sources });
}));
