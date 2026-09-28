import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler } from './lib/http.js';
import { requireMember } from './middleware/auth.js';
import { sessionRouter } from './routes/session.js';
import { membersRouter } from './routes/members.js';
import { dealsRouter } from './routes/deals.js';
import { notesRouter } from './routes/notes.js';
import { activityRouter } from './routes/activity.js';
import { documentsRouter } from './routes/documents.js';
import { backupRouter } from './routes/backup.js';
import { aiRouter } from './routes/ai.js';

const app = express();
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/session', sessionRouter);

const api = express.Router();
api.use(requireMember);
api.use('/members', membersRouter);
api.use('/deals', dealsRouter);
api.use('/notes', notesRouter);
api.use('/documents', documentsRouter);
api.use('/workspace', backupRouter);
api.use('/ai', aiRouter);
api.use(activityRouter);
app.use('/api', api);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Claymont API listening on http://localhost:${port}`);
});
