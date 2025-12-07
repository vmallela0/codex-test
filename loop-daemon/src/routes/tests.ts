// loop-daemon/src/routes/tests.ts
import { Router, Request, Response } from 'express';
import { TestRunner } from '../core/testRunner.js';
import { ChangeSpecStore } from '../core/changeSpec.js';
import { TestRunRequest } from '../types/index.js';
import { Logger } from '../logging.js';

export function testsRouter(runner: TestRunner, store: ChangeSpecStore, logger: Logger): Router {
  const router = Router();

  router.post('/tests/run', async (req: Request, res: Response) => {
    const request = req.body as TestRunRequest;
    if (!request || !request.changeSpecId || !request.framework || !request.cwd) {
      res.status(400).json({ error: 'Invalid test run request' });
      return;
    }
    try {
      const result = await runner.runTests(request);
      store.setTestRun(request.changeSpecId, result);
      res.json(result);
    } catch (err) {
      logger.error('Test run failed', { error: (err as Error).message });
      res.status(500).json({ error: 'Test run failed' });
    }
  });

  return router;
}
