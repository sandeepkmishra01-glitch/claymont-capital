import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncRoute, HttpError } from '../lib/http.js';
import { removeFiles } from '../storage/documents.js';

export const backupRouter = Router();

const EXPORT_VERSION = 1;

backupRouter.get('/export', asyncRoute(async (_req, res) => {
  const [members, deals, dealAssignees, stageHistory, activityLog, notes, documents] = await Promise.all([
    prisma.member.findMany(),
    prisma.deal.findMany(),
    prisma.dealAssignee.findMany(),
    prisma.stageHistory.findMany(),
    prisma.activityLog.findMany(),
    prisma.note.findMany(),
    prisma.document.findMany(),
  ]);
  res.setHeader('Content-Disposition', `attachment; filename="claymont-workspace-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ version: EXPORT_VERSION, exportedAt: new Date(), members, deals, dealAssignees, stageHistory, activityLog, notes, documents });
}));

async function wipe(tx: Prisma.TransactionClient, keepMemberId: string) {
  await tx.activityLog.deleteMany();
  await tx.document.deleteMany();
  await tx.deal.deleteMany();
  await tx.member.deleteMany({ where: { id: { not: keepMemberId } } });
}

backupRouter.post('/wipe', asyncRoute(async (req, res) => {
  const docs = await prisma.document.findMany({ select: { storagePath: true } });
  await prisma.$transaction((tx) => wipe(tx, req.member.id));
  await removeFiles(docs.map((d) => d.storagePath));
  res.status(204).end();
}));

const rows = z.array(z.record(z.unknown())).default([]);
const importSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  members: rows, deals: rows, dealAssignees: rows, stageHistory: rows,
  activityLog: rows, notes: rows, documents: rows,
});

backupRouter.post('/import', asyncRoute(async (req, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "That file isn't a Claymont workspace export");
  const data = parsed.data;
  const me = req.member;
  const oldDocs = await prisma.document.findMany({ select: { storagePath: true } });
  try {
    await prisma.$transaction(async (tx) => {
      await wipe(tx, me.id);
      const members = data.members.filter((m) => m.id !== me.id) as Prisma.MemberCreateManyInput[];
      await tx.member.createMany({ data: members });
      await tx.deal.createMany({ data: data.deals as Prisma.DealCreateManyInput[] });
      await tx.dealAssignee.createMany({ data: data.dealAssignees as Prisma.DealAssigneeCreateManyInput[] });
      await tx.stageHistory.createMany({ data: data.stageHistory as Prisma.StageHistoryCreateManyInput[] });
      await tx.activityLog.createMany({ data: data.activityLog as Prisma.ActivityLogCreateManyInput[] });
      await tx.note.createMany({ data: data.notes as Prisma.NoteCreateManyInput[] });
      await tx.document.createMany({ data: data.documents as Prisma.DocumentCreateManyInput[] });
    }, { timeout: 60_000 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientValidationError) {
      throw new HttpError(400, "That file doesn't match this app's export format");
    }
    throw err;
  }
  const keptPaths = new Set(data.documents.map((d) => d.storagePath));
  await removeFiles(oldDocs.map((d) => d.storagePath).filter((p) => !keptPaths.has(p)));
  res.status(204).end();
}));
