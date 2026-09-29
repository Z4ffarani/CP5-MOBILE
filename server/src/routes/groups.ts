import { Router, type Response } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { getGroupRecord, syncGroupMembers } from '../services/conversationAccess';

export const groupsRouter = Router();

groupsRouter.post('/:groupId/sync-members', authenticate, async (req, res: Response) => {
  const { uid } = req as AuthenticatedRequest;
  const { groupId } = req.params as { groupId: string };

  const group = await getGroupRecord(groupId);

  if (!group) {
    res.status(404).json({ error: 'Grupo não encontrado.' });
    return;
  }

  if (!group.memberIds.includes(uid)) {
    res.status(403).json({ error: 'Somente integrantes podem sincronizar o acesso do grupo.' });
    return;
  }

  await syncGroupMembers(groupId, group.memberIds);
  res.status(200).json({ status: 'synced', members: group.memberIds.length });
});
