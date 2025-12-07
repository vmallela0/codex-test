// loop-daemon/src/routes/patch.ts
import { Router, Request, Response } from 'express';
import { ILlmProvider } from '../core/llmProvider.js';
import { GitService } from '../core/gitService.js';
import { ChangeSpecStore } from '../core/changeSpec.js';
import { PatchProposal, ChangeSpec } from '../types/index.js';
import { Logger } from '../logging.js';

export function patchRouter(
  llmProvider: ILlmProvider,
  gitService: GitService,
  store: ChangeSpecStore,
  logger: Logger
): Router {
  const router = Router();

  router.post('/patch/propose', async (req: Request, res: Response) => {
    const { changeSpec } = req.body as { changeSpec: ChangeSpec };
    if (!changeSpec) {
      res.status(400).json({ error: 'Missing changeSpec' });
      return;
    }
    try {
      const patch = await llmProvider.generatePatch(changeSpec);
      store.setPatch(changeSpec.id, patch);
      res.json(patch);
    } catch (err) {
      logger.error('Failed to generate patch', { error: (err as Error).message });
      res.status(500).json({ error: 'Failed to generate patch' });
    }
  });

  router.post('/patch/apply', async (req: Request, res: Response) => {
    const { patch, changeSpecId } = req.body as { patch: PatchProposal; changeSpecId: string };
    if (!patch || !changeSpecId) {
      res.status(400).json({ error: 'Missing patch or changeSpecId' });
      return;
    }
    try {
      await gitService.applyPatch(patch);
      store.setPatch(changeSpecId, patch);
      res.json({ success: true });
    } catch (err) {
      logger.error('Failed to apply patch', { error: (err as Error).message });
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  });

  router.get('/status/:changeSpecId', (req: Request, res: Response) => {
    const status = store.get(req.params.changeSpecId);
    if (!status) {
      res.status(404).json({ error: 'ChangeSpec not found' });
      return;
    }
    res.json(status);
  });

  return router;
}
