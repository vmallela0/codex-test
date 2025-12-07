// loop-daemon/src/server.ts
import express from 'express';
import { loadConfig } from './config.js';
import { createLogger } from './logging.js';
import { healthRouter } from './routes/health.js';
import { changeSpecRouter } from './routes/changespec.js';
import { patchRouter } from './routes/patch.js';
import { testsRouter } from './routes/tests.js';
import { RepoIndexer } from './core/repoIndexer.js';
import { ChangeSpecStore } from './core/changeSpec.js';
import { EchoLlmProvider } from './core/llmProvider.js';
import { GitService } from './core/gitService.js';
import { TestRunner } from './core/testRunner.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger();
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const store = new ChangeSpecStore();
  const indexer = new RepoIndexer(config.repoRoot, logger);
  await indexer.init();

  const llmProvider = new EchoLlmProvider();
  const gitService = new GitService(config.repoRoot, logger);
  const testRunner = new TestRunner(logger);

  app.use(healthRouter());
  app.use(changeSpecRouter(indexer, store, logger));
  app.use(patchRouter(llmProvider, gitService, store, logger));
  app.use(testsRouter(testRunner, store, logger));

  app.listen(config.port, () => {
    logger.info(`Loop daemon listening on port ${config.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exitCode = 1;
});
