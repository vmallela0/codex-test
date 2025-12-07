// loop-daemon/src/core/testRunner.ts
import { spawn } from 'child_process';
import path from 'path';
import { TestRunRequest, TestRunResult, TestCaseResult } from '../types/index.js';
import { Logger } from '../logging.js';

export class TestRunner {
  constructor(private readonly logger: Logger) {}

  runTests(request: TestRunRequest): Promise<TestRunResult> {
    const command = this.buildCommand(request);
    const start = Date.now();
    return new Promise((resolve) => {
      const child = spawn(command.cmd, command.args, { cwd: request.cwd });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const durationMs = Date.now() - start;
        const status: TestRunResult['status'] = code === 0 ? 'passed' : 'failed';
        const summary = `${request.framework} completed in ${durationMs}ms`;
        const cases: TestCaseResult[] = request.testFiles.map((file) => ({
          name: path.basename(file),
          status: status === 'passed' ? 'passed' : 'failed',
          durationMs,
          stdout,
          stderr,
        }));
        if (request.testFiles.length === 0) {
          cases.push({ name: 'No tests selected', status: 'skipped', durationMs: 0 });
        }
        resolve({ changeSpecId: request.changeSpecId, status, summary, cases });
        this.logger.info('Test run complete', { status, durationMs, testCount: request.testFiles.length });
      });

      child.on('error', (err) => {
        this.logger.error('Test run failed to start', { error: err.message });
        const durationMs = Date.now() - start;
        resolve({
          changeSpecId: request.changeSpecId,
          status: 'error',
          summary: `Failed to start tests: ${err.message}`,
          cases: [
            {
              name: 'startup',
              status: 'skipped',
              durationMs,
              stderr: err.stack,
            },
          ],
        });
      });
    });
  }

  private buildCommand(request: TestRunRequest): { cmd: string; args: string[] } {
    if (request.framework === 'jest') {
      const args = request.testFiles.length > 0 ? ['jest', ...request.testFiles] : ['jest'];
      return { cmd: 'npx', args };
    }
    const args = [...request.testFiles];
    return { cmd: 'pytest', args };
  }
}
