import { PrismaClient } from '@prisma/client';

// Generous limits: over Railway's public TCP proxy each round-trip can take hundreds of ms.
export const prisma = new PrismaClient({
  transactionOptions: { maxWait: 10_000, timeout: 30_000 },
});
