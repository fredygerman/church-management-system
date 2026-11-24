import { Injectable } from '@nestjs/common'
import { and, eq, lt } from 'drizzle-orm'
import { db, aiConversations, type AiConversation, type AiStoredMessage } from '@church/db'

@Injectable()
export class AiConversationStore {
  /** Deletes every conversation whose expires_at is before `now`. Returns the number removed. */
  async purgeExpired(now: Date): Promise<number> {
    const removed = await db
      .delete(aiConversations)
      .where(lt(aiConversations.expiresAt, now))
      .returning({ id: aiConversations.id })
    return removed.length
  }

  /** Returns the conversation only when it belongs to this user and church. */
  async findOwned(id: string, userId: string, churchId: string): Promise<AiConversation | undefined> {
    const [row] = await db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, id),
          eq(aiConversations.userId, userId),
          eq(aiConversations.churchId, churchId),
        ),
      )
      .limit(1)
    return row
  }

  async create(row: { id: string; userId: string; churchId: string; messages: AiStoredMessage[] }): Promise<void> {
    await db.insert(aiConversations).values(row)
  }

  async replaceMessages(id: string, messages: AiStoredMessage[]): Promise<void> {
    await db
      .update(aiConversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
  }
}
