// loop-daemon/src/routes/changespec.ts
import { Router, Request, Response } from 'express';
import { buildChangeSpec } from '../core/impactAnalyzer.js';
import { RepoIndexer } from '../core/repoIndexer.js';
import { ChangeSpecStore } from '../core/changeSpec.js';
import { ChangeIntent } from '../types/index.js';
import { Logger } from '../logging.js';

export function changeSpecRouter(indexer: RepoIndexer, store: ChangeSpecStore, logger: Logger): Router {
  const router = Router();

  router.post('/changespec', (req: Request, res: Response) => {
    const intent = req.body as ChangeIntent;
    if (!intent || !intent.description || !intent.language || !intent.repoRoot) {
      res.status(400).json({ error: 'Invalid intent payload' });
      return;
    }
    try {
      const spec = buildChangeSpec(intent, indexer);
      store.setChangeSpec(spec);
      res.json(spec);
    } catch (err) {
      logger.error('Failed to build change spec', { error: (err as Error).message });
      res.status(500).json({ error: 'Failed to build ChangeSpec' });
    }
  });

  return router;
}
