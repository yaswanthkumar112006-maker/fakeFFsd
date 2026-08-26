import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Scoped to the Procurements module only — writes access/error logs to files,
// flushed at a regular interval rather than on every single write. An injectable
// singleton (one instance per app, shared by every middleware/filter that needs it)
// rather than free functions over module-level state, so it plugs into Nest's DI
// container and lifecycle hooks like any other service.
@Injectable()
export class ProcurementFileLoggerService implements OnModuleDestroy {
  private static readonly LOG_DIR = join(process.cwd(), 'logs');
  private static readonly ACCESS_LOG_FILE = join(
    ProcurementFileLoggerService.LOG_DIR,
    'procurements-access.log',
  );
  private static readonly ERROR_LOG_FILE = join(
    ProcurementFileLoggerService.LOG_DIR,
    'procurements-error.log',
  );
  private static readonly FLUSH_INTERVAL_MS = 5000;
  private static readonly MAX_BUFFERED_LINES = 20;

  private accessBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private dirReadyPromise: Promise<void> | null = null;
  private readonly flushTimer: NodeJS.Timeout;

  constructor() {
    // unref() so this interval never keeps the process alive on its own (e.g. during tests/shutdown).
    this.flushTimer = setInterval(
      () => this.flushAll(),
      ProcurementFileLoggerService.FLUSH_INTERVAL_MS,
    );
    this.flushTimer.unref();
  }

  logAccess(line: string): void {
    this.accessBuffer.push(line + '\n');
    if (this.accessBuffer.length >= ProcurementFileLoggerService.MAX_BUFFERED_LINES) {
      void this.flushBuffer(ProcurementFileLoggerService.ACCESS_LOG_FILE, this.accessBuffer);
    }
  }

  logError(line: string): void {
    this.errorBuffer.push(line + '\n');
    // Errors are higher-value than routine access logs — flush them promptly.
    void this.flushBuffer(ProcurementFileLoggerService.ERROR_LOG_FILE, this.errorBuffer);
  }

  async flushNow(): Promise<void> {
    await Promise.all([
      this.flushBuffer(ProcurementFileLoggerService.ACCESS_LOG_FILE, this.accessBuffer),
      this.flushBuffer(ProcurementFileLoggerService.ERROR_LOG_FILE, this.errorBuffer),
    ]);
  }

  // Nest lifecycle hook — only available because this is a managed class instance,
  // not a bag of functions. Makes sure buffered lines aren't lost on shutdown.
  async onModuleDestroy(): Promise<void> {
    clearInterval(this.flushTimer);
    await this.flushNow();
  }

  private flushAll(): void {
    void this.flushBuffer(ProcurementFileLoggerService.ACCESS_LOG_FILE, this.accessBuffer);
    void this.flushBuffer(ProcurementFileLoggerService.ERROR_LOG_FILE, this.errorBuffer);
  }

  private ensureLogDir(): Promise<void> {
    if (!this.dirReadyPromise) {
      this.dirReadyPromise = mkdir(ProcurementFileLoggerService.LOG_DIR, {
        recursive: true,
      }).then(() => undefined);
    }
    return this.dirReadyPromise;
  }

  private async flushBuffer(file: string, buffer: string[]): Promise<void> {
    if (buffer.length === 0) return;
    const lines = buffer.splice(0, buffer.length).join('');
    try {
      await this.ensureLogDir();
      await appendFile(file, lines, 'utf8');
    } catch (err) {
      // Never let a logging failure break a request — surface it on stderr instead.
      console.error(`[procurements] failed to write log file ${file}:`, err);
    }
  }
}
