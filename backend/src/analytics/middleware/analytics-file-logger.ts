import { Injectable } from '@nestjs/common';
import { appendFile, mkdir, rename } from 'fs/promises';
import { join } from 'path';

// Scoped to the Analytics module only — writes every access/error line straight to
// its own log file the moment it happens (no in-memory buffering, so nothing is
// ever lost if the process crashes). Log files are rotated daily: when the date
// changes, the current file is renamed to analytics-access-YYYY-MM-DD.log and a
// fresh one is started — the "regular interval" at which log data is managed.
@Injectable()
export class AnalyticsFileLoggerService {
  private static readonly LOG_DIR = join(process.cwd(), 'logs');
  private static readonly ACCESS_LOG_FILE = join(AnalyticsFileLoggerService.LOG_DIR, 'analytics-access.log');
  private static readonly ERROR_LOG_FILE = join(AnalyticsFileLoggerService.LOG_DIR, 'analytics-error.log');

  private dirReadyPromise: Promise<void> | null = null;
  private currentDate = AnalyticsFileLoggerService.today();

  logAccess(line: string): void {
    void this.writeLine(AnalyticsFileLoggerService.ACCESS_LOG_FILE, line);
  }

  logError(line: string): void {
    void this.writeLine(AnalyticsFileLoggerService.ERROR_LOG_FILE, line);
  }

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private ensureLogDir(): Promise<void> {
    if (!this.dirReadyPromise) {
      this.dirReadyPromise = mkdir(AnalyticsFileLoggerService.LOG_DIR, { recursive: true }).then(
        () => undefined,
      );
    }
    return this.dirReadyPromise;
  }

  private async rotateIfNeeded(): Promise<void> {
    const today = AnalyticsFileLoggerService.today();
    if (today === this.currentDate) return;

    const stamp = this.currentDate;
    this.currentDate = today;

    for (const file of [AnalyticsFileLoggerService.ACCESS_LOG_FILE, AnalyticsFileLoggerService.ERROR_LOG_FILE]) {
      try {
        await rename(file, file.replace(/\.log$/, `-${stamp}.log`));
      } catch {
        // Nothing to rotate on the very first write of a new day — ignore.
      }
    }
  }

  private async writeLine(file: string, line: string): Promise<void> {
    try {
      await this.ensureLogDir();
      await this.rotateIfNeeded();
      await appendFile(file, line + '\n', 'utf8');
    } catch (err) {
      console.error(`[analytics] failed to write log file ${file}:`, err);
    }
  }
}
