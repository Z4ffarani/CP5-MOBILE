import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { MulterError } from 'multer';
import { TimeoutError } from './utils/withTimeout';
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
    if (err instanceof TimeoutError) {
      res.status(503).json({ error: 'O Firebase não respondeu a tempo. Tente novamente em instantes.' });
      return;
    }
    if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'A foto excede o tamanho máximo de 5 MB.' });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
  });

  return app;
}
