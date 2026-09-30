import { Router, type Response } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { getFullProfile, sharesConversation } from '../services/conversationAccess';

export const usersRouter = Router();

// Dados cadastrais (e-mail, celular, data de nascimento) de outro usuário: liberados apenas para quem
// compartilha com ele uma conversa individual ou um grupo. As regras do Firestore restringem o documento
// privado ao próprio dono, então esta verificação, que cruza conversas e grupos, fica na API.
usersRouter.get('/:uid/profile', authenticate, async (req, res: Response) => {
  const { uid: requesterId } = req as AuthenticatedRequest;
  const { uid: targetId } = req.params as { uid: string };

  if (requesterId !== targetId && !(await sharesConversation(requesterId, targetId))) {
    res.status(403).json({ error: 'Perfil disponível apenas para quem compartilha uma conversa ou grupo.' });
    return;
  }

  const profile = await getFullProfile(targetId);
  if (!profile) {
    res.status(404).json({ error: 'Perfil não encontrado.' });
    return;
  }

  res.status(200).json(profile);
});
