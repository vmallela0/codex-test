// loop-daemon/src/core/changeSpec.ts
import { ChangeSpec, PatchProposal, TestRunResult } from '../types/index.js';

export interface ChangeSpecStatus {
  changeSpec: ChangeSpec;
  lastPatch?: PatchProposal;
  lastTestRun?: TestRunResult;
}

export class ChangeSpecStore {
  private readonly store = new Map<string, ChangeSpecStatus>();

  setChangeSpec(spec: ChangeSpec): void {
    const current = this.store.get(spec.id) ?? { changeSpec: spec };
    this.store.set(spec.id, { ...current, changeSpec: spec });
  }

  setPatch(changeSpecId: string, patch: PatchProposal): void {
    const current = this.store.get(changeSpecId);
    if (!current) {
      throw new Error(`ChangeSpec not found for ${changeSpecId}`);
    }
    this.store.set(changeSpecId, { ...current, lastPatch: patch });
  }

  setTestRun(changeSpecId: string, testRun: TestRunResult): void {
    const current = this.store.get(changeSpecId);
    if (!current) {
      throw new Error(`ChangeSpec not found for ${changeSpecId}`);
    }
    this.store.set(changeSpecId, { ...current, lastTestRun: testRun });
  }

  get(changeSpecId: string): ChangeSpecStatus | undefined {
    return this.store.get(changeSpecId);
  }
}
