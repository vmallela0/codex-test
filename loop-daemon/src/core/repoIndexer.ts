// loop-daemon/src/core/repoIndexer.ts
import fs from 'fs';
import path from 'path';
import { Logger } from '../logging.js';

export interface RepoIndex {
  repoRoot: string;
  sourceFiles: string[];
  testFiles: string[];
}

export class RepoIndexer {
  private index?: RepoIndex;

  constructor(private readonly repoRoot: string, private readonly logger: Logger) {}

  async init(): Promise<RepoIndex> {
    const sourceFiles: string[] = [];
    const testFiles: string[] = [];
    await this.walk(this.repoRoot, (filePath) => {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.py')) {
        sourceFiles.push(filePath);
      }
      if (this.isTestFile(filePath)) {
        testFiles.push(filePath);
      }
    });
    this.index = { repoRoot: this.repoRoot, sourceFiles, testFiles };
    this.logger.info('Repo indexed', { sourceCount: sourceFiles.length, testCount: testFiles.length });
    return this.index;
  }

  getIndex(): RepoIndex {
    if (!this.index) {
      throw new Error('Repo index not initialized');
    }
    return this.index;
  }

  getRelatedFiles(filePath: string): string[] {
    if (!this.index) {
      return [];
    }
    const targetDir = path.dirname(filePath);
    return this.index.sourceFiles.filter((file) => path.dirname(file) === targetDir && file !== filePath);
  }

  getLikelyTestFilesForFile(filePath: string): string[] {
    if (!this.index) {
      return [];
    }
    const base = path.basename(filePath).replace(path.extname(filePath), '');
    return this.index.testFiles.filter((file) => file.includes(base));
  }

  private async walk(dir: string, onFile: (filePath: string) => void): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            return;
          }
          await this.walk(fullPath, onFile);
        } else if (entry.isFile()) {
          onFile(fullPath);
        }
      })
    );
  }

  private isTestFile(filePath: string): boolean {
    const name = path.basename(filePath);
    return (
      name.endsWith('.test.ts') ||
      name.endsWith('.spec.ts') ||
      name.endsWith('.test.tsx') ||
      /^test_.*\.py$/.test(name) ||
      /.*_test\.py$/.test(name)
    );
  }
}
