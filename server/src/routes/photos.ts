import { Router, type Response } from 'express';
import multer from 'multer';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { adminFirestore } from '../services/firebaseAdmin';
import { uploadObject, getPresignedDownloadUrl } from '../services/storageBucket';
import type { ChatGroupRecord } from '../types';

export const photosRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const FILENAME: Record<'users' | 'groups', string> = {
  users: 'profile.jpg',
  groups: 'photo.jpg',
};

function objectKey(scope: 'users' | 'groups', id: string): string {
  return `${scope}/${id}/${FILENAME[scope]}`;
}

function publicUrl(req: { protocol: string; get: (name: string) => string | undefined }, scope: string, id: string): string {
  return `${req.protocol}://${req.get('host')}/photos/${scope}/${id}`;
}

async function isAuthorized(scope: 'users' | 'groups', id: string, uid: string): Promise<boolean> {
  if (scope === 'users') return id === uid;

  const groupSnapshot = await adminFirestore.collection('groups').doc(id).get();
  if (!groupSnapshot.exists) return true;

  const group = groupSnapshot.data() as ChatGroupRecord;
  return group.ownerId === uid;
}

photosRouter.post('/:scope/:id', authenticate, upload.single('file'), async (req, res: Response) => {
  const { uid } = req as AuthenticatedRequest;
  const { scope, id } = req.params as { scope: string; id: string };

  if (scope !== 'users' && scope !== 'groups') {
    res.status(400).json({ error: 'scope inválido.' });
    return;
  }

  if (!(await isAuthorized(scope, id, uid))) {
    res.status(403).json({ error: 'Você não tem permissão para alterar esta foto.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'Arquivo não enviado.' });
    return;
  }

  await uploadObject(objectKey(scope, id), req.file.buffer, req.file.mimetype);

  res.status(200).json({ url: publicUrl(req, scope, id) });
});

photosRouter.get('/:scope/:id', async (req, res: Response) => {
  const { scope, id } = req.params as { scope: string; id: string };

  if (scope !== 'users' && scope !== 'groups') {
    res.status(400).json({ error: 'scope inválido.' });
    return;
  }

  const presignedUrl = await getPresignedDownloadUrl(objectKey(scope, id));
  res.redirect(302, presignedUrl);
});
