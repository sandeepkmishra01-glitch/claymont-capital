import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncRoute, HttpError } from '../lib/http.js';

export const notesRouter = Router();

notesRouter.get('/', asyncRoute(async (req, res) => {
  const dealId = z.string().uuid().parse(req.query.dealId);
  res.json(await prisma.note.findMany({ where: { dealId }, orderBy: { createdAt: 'desc' } }));
}));

notesRouter.post('/', asyncRoute(async (req, res) => {
  const { dealId, body } = z.object({ dealId: z.string().uuid(), body: z.string().trim().min(1).max(10000) }).parse(req.body);
  const memberId = req.member.id;
  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.note.create({ data: { dealId, memberId, body } });
    await tx.activityLog.create({ data: { dealId, memberId, actionType: 'note_added', actionText: 'Added a note' } });
    return created;
  });
  res.status(201).json(note);
}));

notesRouter.delete('/:id', asyncRoute(async (req, res) => {
  const note = await prisma.note.findUniqueOrThrow({ where: { id: req.params.id } });
  if (note.memberId && note.memberId !== req.member.id) throw new HttpError(403, 'You can only delete your own notes');
  await prisma.note.delete({ where: { id: note.id } });
  res.status(204).end();
}));
