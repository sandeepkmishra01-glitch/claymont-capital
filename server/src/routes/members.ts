import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncRoute, HttpError } from '../lib/http.js';
import { avatarColorFor } from '../lib/constants.js';

export const membersRouter = Router();

const memberSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  role: z.string().trim().max(60).nullish(),
  email: z.string().trim().email().max(120).nullish().or(z.literal('')),
});

membersRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await prisma.member.findMany({ orderBy: { createdAt: 'asc' } }));
}));

membersRouter.post('/', asyncRoute(async (req, res) => {
  const data = memberSchema.parse(req.body);
  const member = await prisma.member.create({
    data: { ...data, email: data.email || null, avatarColor: avatarColorFor(data.displayName) },
  });
  res.status(201).json(member);
}));

membersRouter.patch('/:id', asyncRoute(async (req, res) => {
  const data = memberSchema.partial().parse(req.body);
  const member = await prisma.member.update({
    where: { id: req.params.id },
    data: { ...data, email: data.email === '' ? null : data.email },
  });
  res.json(member);
}));

membersRouter.delete('/:id', asyncRoute(async (req, res) => {
  if (req.params.id === req.member.id) throw new HttpError(400, "You can't remove yourself");
  await prisma.member.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
