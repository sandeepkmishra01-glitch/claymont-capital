import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncRoute, HttpError } from '../lib/http.js';
import { DOC_TYPES } from '../lib/constants.js';
import { DOCUMENTS_DIR, absolutePath, removeFiles, toStoragePath } from '../storage/documents.js';

export const documentsRouter = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(DOCUMENTS_DIR, 'uploads');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_').slice(-120);
      cb(null, `${randomUUID()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

documentsRouter.get('/', asyncRoute(async (req, res) => {
  const dealId = z.string().uuid().optional().parse(req.query.dealId);
  res.json(await prisma.document.findMany({
    where: dealId ? { dealId } : undefined,
    orderBy: { uploadedAt: 'desc' },
  }));
}));

documentsRouter.post('/', upload.single('file'), asyncRoute(async (req, res) => {
  const file = req.file;
  if (!file) throw new HttpError(400, 'No file uploaded');
  const parsed = z.object({
    dealId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
    docType: z.enum(DOC_TYPES),
  }).safeParse(req.body);
  if (!parsed.success) {
    await removeFiles([toStoragePath(file.path)]);
    throw parsed.error;
  }
  const { dealId, docType } = parsed.data;
  const uploaderId = req.member.id;
  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        dealId: dealId ?? null,
        uploaderId,
        fileName: file.originalname,
        storagePath: toStoragePath(file.path),
        docType,
        sizeBytes: file.size,
      },
    });
    if (dealId) {
      await tx.activityLog.create({
        data: { dealId, memberId: uploaderId, actionType: 'document_uploaded', actionText: `Uploaded ${file.originalname}` },
      });
    }
    return created;
  });
  res.status(201).json(doc);
}));

documentsRouter.get('/:id/download', asyncRoute(async (req, res) => {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: req.params.id } });
  const full = doc.storagePath ? absolutePath(doc.storagePath) : null;
  if (!full || !fs.existsSync(full)) throw new HttpError(404, 'This is a sample document with no file attached');
  res.download(full, doc.fileName);
}));

documentsRouter.delete('/:id', asyncRoute(async (req, res) => {
  const doc = await prisma.document.delete({ where: { id: req.params.id } });
  await removeFiles([doc.storagePath]);
  res.status(204).end();
}));
