// loop-daemon/src/config.ts
import path from 'path';

type Env = {
  PORT?: string;
  REPO_ROOT?: string;
};

export interface Config {
  port: number;
  repoRoot: string;
}

export function loadConfig(env: Env = process.env): Config {
  const port = Number(env.PORT ?? 5908);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${env.PORT ?? 'undefined'}`);
  }

  const repoRoot = env.REPO_ROOT ? path.resolve(env.REPO_ROOT) : process.cwd();
  return { port, repoRoot };
}
