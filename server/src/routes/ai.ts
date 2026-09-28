import { Router } from 'express';
import multer from 'multer';
import { asyncRoute, HttpError } from '../lib/http.js';
import { aiConfigured, extractDeal, MAX_AI_FILE_BYTES } from '../lib/ai.js';

export const aiRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_AI_FILE_BYTES } });

aiRouter.get('/status', (_req, res) => {
  res.json({ configured: aiConfigured() });
});

aiRouter.post('/extract', upload.single('file'), asyncRoute(async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!req.file && !url) throw new HttpError(400, 'Upload a document or paste a company URL');
  const extraction = await extractDeal(
    req.file
      ? { file: { buffer: req.file.buffer, fileName: req.file.originalname, mimeType: req.file.mimetype } }
      : { url },
  );
  res.json(extraction);
}));
