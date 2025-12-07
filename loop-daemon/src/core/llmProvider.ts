// loop-daemon/src/core/llmProvider.ts
import fs from 'fs';
import path from 'path';
import { ChangeSpec, PatchFileChange, PatchProposal } from '../types/index.js';

export interface ILlmProvider {
  generatePatch(changeSpec: ChangeSpec): Promise<PatchProposal>;
}

export class EchoLlmProvider implements ILlmProvider {
  async generatePatch(changeSpec: ChangeSpec): Promise<PatchProposal> {
    const changes: PatchFileChange[] = await Promise.all(
      changeSpec.targets.files.map(async (filePath) => {
        const absolute = path.resolve(filePath);
        const before = await fs.promises.readFile(absolute, 'utf8').catch(() => '');
        const comment = changeSpec.intent.language === 'python' ? '# TODO' : '// TODO';
        const after = `${before}\n${comment}: implement ${changeSpec.id}`;
        return { filePath: absolute, before, after };
      })
    );

    return { changeSpecId: changeSpec.id, changes, notes: ['Echo patch generated locally'] };
  }
}
