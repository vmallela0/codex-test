// loop-daemon/src/routes/health.ts
import { Router, Request, Response } from 'express';

export function healthRouter(): Router {
  const router = Router();
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });
  return router;
}
