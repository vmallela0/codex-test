// loop-daemon/src/core/gitService.ts
import fs from 'fs';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { PatchProposal } from '../types/index.js';
import { Logger } from '../logging.js';

export class GitService {
  private readonly git: SimpleGit;

  constructor(private readonly repoRoot: string, private readonly logger: Logger) {
    this.git = simpleGit({ baseDir: repoRoot });
  }

  async ensureBranchForChange(changeSpecId: string): Promise<void> {
    const branchName = this.branchName(changeSpecId);
    const branches = await this.git.branchLocal();
    if (!branches.all.includes(branchName)) {
      await this.git.checkoutLocalBranch(branchName);
      this.logger.info('Created branch for change', { branchName });
    } else {
      await this.git.checkout(branchName);
      this.logger.info('Checked out existing branch', { branchName });
    }
  }

  async applyPatch(patch: PatchProposal): Promise<void> {
    await this.ensureBranchForChange(patch.changeSpecId);
    for (const change of patch.changes) {
      const targetPath = path.resolve(change.filePath);
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, change.after, 'utf8');
    }
    await this.git.add('.');
  }

  private branchName(changeSpecId: string): string {
    return `loop/${changeSpecId}`;
  }
}
