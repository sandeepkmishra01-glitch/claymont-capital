import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signSession } from '../lib/jwt.js';
import { asyncRoute } from '../lib/http.js';
import { avatarColorFor } from '../lib/constants.js';
import { requireMember } from '../middleware/auth.js';

export const sessionRouter = Router();

const nameSchema = z.object({ displayName: z.string().trim().min(2).max(80) });

sessionRouter.post('/', asyncRoute(async (req, res) => {
  const { displayName } = nameSchema.parse(req.body);
  const existing = await prisma.member.findFirst({
    where: { displayName: { equals: displayName, mode: 'insensitive' } },
  });
  const member = existing
    ? await prisma.member.update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } })
    : await prisma.member.create({
        data: { displayName, avatarColor: avatarColorFor(displayName), lastSeenAt: new Date() },
      });
  res.json({ token: signSession(member.id), member });
}));

sessionRouter.get('/me', requireMember, asyncRoute(async (req, res) => {
  const member = await prisma.member.update({ where: { id: req.member.id }, data: { lastSeenAt: new Date() } });
  res.json({ member });
}));

sessionRouter.patch('/me', requireMember, asyncRoute(async (req, res) => {
  const { displayName } = nameSchema.parse(req.body);
  const member = await prisma.member.update({ where: { id: req.member.id }, data: { displayName } });
  res.json({ member });
}));
