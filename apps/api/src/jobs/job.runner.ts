import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { JobDefinition } from './job';

@Injectable()
export class JobRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobRunner.name);
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly running = new Set<string>();

  register(job: JobDefinition) {
    if (!job.name || !Number.isInteger(job.intervalMs) || job.intervalMs < 1000) throw new Error('Invalid job definition');
    if (this.timers.has(job.name)) throw new Error(`Job already registered: ${job.name}`);
    const timer = setInterval(() => void this.execute(job), job.intervalMs);
    this.timers.set(job.name, timer);
  }

  async onModuleInit() {}

  onModuleDestroy() {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }

  private async execute(job: JobDefinition) {
    if (this.running.has(job.name)) return;
    this.running.add(job.name);
    try {
      await job.handler();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown background job error';
      this.logger.error(`Job ${job.name} failed: ${message}`);
    } finally {
      this.running.delete(job.name);
    }
  }
}
