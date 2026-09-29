import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';

export type AuthenticatedRequest = Request & { uid: string };

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação ausente.' });
    return;
  }

  const idToken = header.slice('Bearer '.length);

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    (req as AuthenticatedRequest).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Token de autenticação inválido.' });
  }
}
