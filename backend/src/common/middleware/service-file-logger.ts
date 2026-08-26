import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { appendFile, mkdir, rename } from 'fs/promises';
import { join } from 'path';

/**
 * Shared file logger for the Support / Communications / Maintenance services.
 *
 * Satisfies the "logs and error information should be stored in files at regular
 * intervals" requirement: lines are buffered in memory and flushed to disk on a
 * timer (and when a buffer fills), instead of doing a blocking appendFileSync on
 * every single request as the previous implementation did.
 *
 * Files are rotated daily — when the date changes, the current access.log /
 * error.log is renamed to access-YYYY-MM-DD.log / error-YYYY-MM-DD.log and a
 * fresh file is started, so logs stay readable instead of growing forever.
 */
@Injectable()
export class ServiceFileLoggerService implements OnModuleDestroy {
  private static readonly LOG_DIR = join(process.cwd(), 'logs');
  private static readonly ACCESS_LOG = join(ServiceFileLoggerService.LOG_DIR, 'access.log');
  private static readonly ERROR_LOG = join(ServiceFileLoggerService.LOG_DIR, 'error.log');
  private static readonly FLUSH_INTERVAL_MS = 5000;
  private static readonly MAX_BUFFERED_LINES = 25;

  // One instance per process. The global exception filter in main.ts is built with
  // `new` (outside the DI container) and still has to write to the same buffers, so
  // the DI provider below hands back this same shared instance rather than a second one.
  private static instance: ServiceFileLoggerService | null = null;

  static getShared(): ServiceFileLoggerService {
    if (!ServiceFileLoggerService.instance) {
      ServiceFileLoggerService.instance = new ServiceFileLoggerService();
    }
    return ServiceFileLoggerService.instance;
  }

  private accessBuffer: string[] = [];
  private errorBuffer: string[] = [];
  private dirReadyPromise: Promise<void> | null = null;
  private currentDate = ServiceFileLoggerService.today();
  private readonly flushTimer: NodeJS.Timeout;

  constructor() {
    // unref() so this timer never keeps the process alive on its own.
    this.flushTimer = setInterval(
      () => this.flushAll(),
      ServiceFileLoggerService.FLUSH_INTERVAL_MS,
    );
    this.flushTimer.unref();
  }

  logAccess(line: string): void {
    this.accessBuffer.push(line + '\n');
    if (this.accessBuffer.length >= ServiceFileLoggerService.MAX_BUFFERED_LINES) {
      void this.flushBuffer(ServiceFileLoggerService.ACCESS_LOG, this.accessBuffer);
    }
  }

  logError(line: string): void {
    this.errorBuffer.push(line + '\n');
    // Errors matter more than routine access lines — write them out promptly
    // rather than waiting for the next tick of the interval.
    void this.flushBuffer(ServiceFileLoggerService.ERROR_LOG, this.errorBuffer);
  }

  /** Force both buffers to disk. Used on shutdown and by the test suite. */
  async flushNow(): Promise<void> {
    await Promise.all([
      this.flushBuffer(ServiceFileLoggerService.ACCESS_LOG, this.accessBuffer),
      this.flushBuffer(ServiceFileLoggerService.ERROR_LOG, this.errorBuffer),
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.flushTimer);
    await this.flushNow();
  }

  private static today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private flushAll(): void {
    void this.flushBuffer(ServiceFileLoggerService.ACCESS_LOG, this.accessBuffer);
    void this.flushBuffer(ServiceFileLoggerService.ERROR_LOG, this.errorBuffer);
  }

  private ensureLogDir(): Promise<void> {
    if (!this.dirReadyPromise) {
      this.dirReadyPromise = mkdir(ServiceFileLoggerService.LOG_DIR, {
        recursive: true,
      }).then(() => undefined);
    }
    return this.dirReadyPromise;
  }

  /** Roll access.log/error.log to date-stamped archives when the day changes. */
  private async rotateIfNeeded(): Promise<void> {
    const today = ServiceFileLoggerService.today();
    if (today === this.currentDate) return;

    const stamp = this.currentDate;
    this.currentDate = today;

    for (const file of [
      ServiceFileLoggerService.ACCESS_LOG,
      ServiceFileLoggerService.ERROR_LOG,
    ]) {
      try {
        await rename(file, file.replace(/\.log$/, `-${stamp}.log`));
      } catch {
        // Nothing to rotate on the very first run of a new day — ignore.
      }
    }
  }

  private async flushBuffer(file: string, buffer: string[]): Promise<void> {
    if (buffer.length === 0) return;
    // splice first so concurrent callers can't write the same lines twice.
    const lines = buffer.splice(0, buffer.length).join('');
    try {
      await this.ensureLogDir();
      await this.rotateIfNeeded();
      await appendFile(file, lines, 'utf8');
    } catch (err) {
      // A logging failure must never break a request — surface it on stderr instead.
      console.error(`[service-logger] failed to write ${file}:`, err);
    }
  }
}

/**
 * Makes the single shared logger injectable anywhere without each feature module
 * having to re-declare it as a provider.
 */
@Global()
@Module({
  providers: [
    {
      provide: ServiceFileLoggerService,
      useFactory: () => ServiceFileLoggerService.getShared(),
    },
  ],
  exports: [ServiceFileLoggerService],
})
export class ServiceLoggingModule {}
