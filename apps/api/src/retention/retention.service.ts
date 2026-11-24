import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { and, eq, isNotNull, lt } from 'drizzle-orm'
import { aiConversations, db, documents, refreshTokens } from '@church/db'
import { FileUploadService } from '../file-upload/file-upload.service'

/** Soft-deleted documents are kept this long, then removed from storage and the database (DEC-09). */
export const DOCUMENT_RETENTION_DAYS = 30
/** Documents removed per run. Remaining rows are picked up by the next run. */
const DOCUMENT_BATCH_SIZE = 100
const DAY_MS = 24 * 60 * 60 * 1000

export interface RetentionResult {
  documentsPurged: number
  documentsFailed: number
  refreshTokensPurged: number
  aiConversationsPurged: number
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name)

  constructor(private readonly files: FileUploadService) {}

  /** Daily purge of data past its retention period (DEC-08 AI conversations, DEC-09 documents, refresh tokens). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runRetention(now: Date = new Date()): Promise<RetentionResult> {
    const { purged, failed } = await this.purgeDocuments(now)

    const expiredTokens = await db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, now))
      .returning({ id: refreshTokens.id })

    const expiredConversations = await db
      .delete(aiConversations)
      .where(lt(aiConversations.expiresAt, now))
      .returning({ id: aiConversations.id })

    const result: RetentionResult = {
      documentsPurged: purged,
      documentsFailed: failed,
      refreshTokensPurged: expiredTokens.length,
      aiConversationsPurged: expiredConversations.length,
    }
    this.logger.log(`Retention run: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * Removes the stored object first, then the row. If the object cannot be removed the
   * row stays, so the next run retries it and no file is left without a record.
   */
  private async purgeDocuments(now: Date): Promise<{ purged: number; failed: number }> {
    const cutoff = new Date(now.getTime() - DOCUMENT_RETENTION_DAYS * DAY_MS)
    const due = await db
      .select({ id: documents.id, storageKey: documents.storageKey })
      .from(documents)
      .where(and(isNotNull(documents.deletedAt), lt(documents.deletedAt, cutoff)))
      .limit(DOCUMENT_BATCH_SIZE)

    let purged = 0
    let failed = 0
    for (const doc of due) {
      try {
        await this.files.deleteFromS3(doc.storageKey)
      } catch {
        failed++
        continue
      }
      await db.delete(documents).where(eq(documents.id, doc.id))
      purged++
    }
    return { purged, failed }
  }
}
