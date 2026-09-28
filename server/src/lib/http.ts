import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';

type Handler = (req: Request, res: Response) => Promise<unknown>;

export const asyncRoute = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid input', details: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    res.status(400).json({ error: 'Refers to a record that does not exist' });
    return;
  }
  if (err instanceof Prisma.PrismaClientInitializationError || (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P1001')) {
    console.error(err.message);
    res.status(503).json({ error: 'Database is unreachable right now — try again in a moment' });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large' : err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
