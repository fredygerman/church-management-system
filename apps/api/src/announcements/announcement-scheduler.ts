import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'

export const SCHEDULER_INTERVAL_MS = 60_000

/**
 * Publishes scheduled announcements once their time has passed. One interval per process, started in
 * onModuleInit and cleared in onModuleDestroy. The in-flight flag stops a slow pass from overlapping the next.
 */
@Injectable()
export class AnnouncementScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnnouncementScheduler.name)
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(private readonly announcements: AnnouncementsService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.runPass()
    }, SCHEDULER_INTERVAL_MS)
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /** Returns false when the pass was skipped because the previous one is still running. */
  async runPass(): Promise<boolean> {
    if (this.running) return false
    this.running = true
    try {
      const { published, held, failed } = await this.announcements.publishDueScheduled()
      if (published + held + failed > 0) {
        this.logger.log(`Scheduled announcements: ${published} published, ${held} held for approval, ${failed} failed`)
      }
    } catch (error) {
      this.logger.error('Scheduled announcement pass failed', error instanceof Error ? error.stack : undefined)
    } finally {
      this.running = false
    }
    return true
  }
}
