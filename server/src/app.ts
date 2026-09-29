import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { groupsRouter } from './routes/groups';
import { healthRouter } from './routes/health';
import { notificationsRouter } from './routes/notifications';
import { photosRouter } from './routes/photos';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', true);
  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/groups', groupsRouter);
  app.use('/photos', photosRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
  });

  return app;
}
