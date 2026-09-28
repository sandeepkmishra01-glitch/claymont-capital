import type { NextFunction, Request, Response } from 'express';
import type { Member } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifySession } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      member: Member;
    }
  }
}

export async function requireMember(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const memberId = token ? verifySession(token) : null;
    const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null;
    if (!member) {
      res.status(401).json({ error: 'Not signed in' });
      return;
    }
    req.member = member;
    next();
  } catch (err) {
    next(err);
  }
}
