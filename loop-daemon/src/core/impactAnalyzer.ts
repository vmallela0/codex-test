// loop-daemon/src/core/impactAnalyzer.ts
import path from 'path';
import { randomUUID } from 'crypto';
import { ChangeIntent, ChangeSpec } from '../types/index.js';
import { RepoIndexer } from './repoIndexer.js';

export function buildChangeSpec(intent: ChangeIntent, indexer: RepoIndexer): ChangeSpec {
  const targets = deriveTargets(intent, indexer);
  const testPolicy = {
    strategy: 'targeted' as const,
    include: deriveTests(targets.files, indexer),
    exclude: [],
  };

  return {
    id: randomUUID(),
    intent,
    targets,
    riskLevel: 'medium',
    testPolicy,
    constraints: ['Keep changes minimal', 'Ensure tests remain passing'],
  };
}

function deriveTargets(intent: ChangeIntent, indexer: RepoIndexer): { files: string[] } {
  const files: string[] = [];
  if (intent.fileContext) {
    const contextPath = path.resolve(intent.fileContext);
    files.push(contextPath);
    const related = indexer.getRelatedFiles(contextPath);
    files.push(...related.slice(0, 3));
  }
  return { files: Array.from(new Set(files)) };
}

function deriveTests(files: string[], indexer: RepoIndexer): string[] {
  const testFiles: string[] = [];
  files.forEach((file) => {
    const matches = indexer.getLikelyTestFilesForFile(file);
    testFiles.push(...matches);
  });
  return Array.from(new Set(testFiles));
}
