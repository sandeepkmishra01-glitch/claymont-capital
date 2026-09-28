import fs from 'node:fs/promises';
import path from 'node:path';

export const DOCUMENTS_DIR = path.resolve(process.env.DOCUMENTS_DIR ?? './data/documents');

export function toStoragePath(fullPath: string): string {
  return path.relative(DOCUMENTS_DIR, fullPath).split(path.sep).join('/');
}

export function absolutePath(storagePath: string): string {
  const full = path.resolve(DOCUMENTS_DIR, storagePath);
  if (!full.startsWith(DOCUMENTS_DIR + path.sep)) throw new Error('Invalid storage path');
  return full;
}

export async function removeFiles(storagePaths: (string | null)[]) {
  await Promise.all(
    storagePaths.filter((p): p is string => !!p).map((p) => fs.rm(absolutePath(p), { force: true })),
  );
}
