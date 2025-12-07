// loop-daemon/src/types/index.ts

export interface ChangeIntent {
  description: string;
  fileContext?: string;
  selectedCode?: string;
  language: 'typescript' | 'python';
  repoRoot: string;
}

export interface ChangeSpec {
  id: string;
  intent: ChangeIntent;
  targets: { files: string[] };
  riskLevel: 'low' | 'medium' | 'high';
  testPolicy: { strategy: 'none' | 'targeted' | 'broad'; include?: string[]; exclude?: string[] };
  constraints: string[];
}

export interface PatchFileChange {
  filePath: string;
  before: string;
  after: string;
}

export interface PatchProposal {
  changeSpecId: string;
  changes: PatchFileChange[];
  notes: string[];
}

export interface TestRunRequest {
  changeSpecId: string;
  testFiles: string[];
  framework: 'jest' | 'pytest';
  cwd: string;
}

export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  stdout?: string;
  stderr?: string;
}

export interface TestRunResult {
  changeSpecId: string;
  status: 'passed' | 'failed' | 'error';
  summary: string;
  cases: TestCaseResult[];
}
