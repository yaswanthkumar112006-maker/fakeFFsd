import { Injectable } from '@nestjs/common';
import { appendFile, mkdir, rename } from 'fs/promises';
import { join } from 'path';

// Scoped to the Profile module only — writes every access/error line straight
// to its own log file the moment it happens (no in-memory buffering). Log files
// are rotated daily: when the date changes, the current file is renamed to
// profile-access-YYYY-MM-DD.log and a fresh one is started.
@Injectable()
export class ProfileFileLoggerService {
  private static readonly LOG_DIR = join(process.cwd(), 'logs');
  private static readonly ACCESS_LOG_FILE = join(
    ProfileFileLoggerService.LOG_DIR,
    'profile-access.log',
  );
  private static readonly ERROR_LOG_FILE = join(
    ProfileFileLoggerService.LOG_DIR,
    'profile-error.log',
  );

  private dirReadyPromise: Promise<void> | null = null;
  private currentDate = ProfileFileLoggerService.today();

  logAccess(line: string): void {
    void this.writeLine(ProfileFileLoggerService.ACCESS_LOG_FILE, line);
  }

  logError(line: string): void {
    void this.writeLine(ProfileFileLoggerService.ERROR_LOG_FILE, line);
  }

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private ensureLogDir(): Promise<void> {
    if (!this.dirReadyPromise) {
      this.dirReadyPromise = mkdir(ProfileFileLoggerService.LOG_DIR, {
        recursive: true,
      }).then(() => undefined);
    }
    return this.dirReadyPromise;
  }

  private async rotateIfNeeded(): Promise<void> {
    const today = ProfileFileLoggerService.today();
    if (today === this.currentDate) return;

    const stamp = this.currentDate;
    this.currentDate = today;

    for (const file of [
      ProfileFileLoggerService.ACCESS_LOG_FILE,
      ProfileFileLoggerService.ERROR_LOG_FILE,
    ]) {
      try {
        await rename(file, file.replace(/\.log$/, `-${stamp}.log`));
      } catch {
        // ignore
      }
    }
  }

  private async writeLine(file: string, line: string): Promise<void> {
    try {
      await this.ensureLogDir();
      await this.rotateIfNeeded();
      await appendFile(file, line + '\n', 'utf8');
    } catch (err) {
      console.error(`[profile] failed to write log file ${file}:`, err);
    }
  }
}
