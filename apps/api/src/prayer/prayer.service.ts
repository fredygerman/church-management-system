import { Injectable } from '@nestjs/common'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '@church/db'
import { prayerRequests, type PrayerRequest } from '@church/db'

export type CreatePrayerRequestInput = {
  churchId: string
  userId: string
  memberId: string
  content: string
}

@Injectable()
export class PrayerService {
  /**
   * Create a prayer request for the caller (self-service)
   */
  async createPrayerRequest(data: CreatePrayerRequestInput): Promise<PrayerRequest> {
    const [prayerRequest] = await db.insert(prayerRequests).values(data).returning()
    return prayerRequest
  }

  /**
   * Get the caller's own prayer requests for their active church, newest first
   */
  async getMyPrayerRequests(churchId: string, userId: string): Promise<PrayerRequest[]> {
    return db.query.prayerRequests.findMany({
      where: and(
        eq(prayerRequests.churchId, churchId),
        eq(prayerRequests.userId, userId),
        isNull(prayerRequests.deletedAt),
      ),
      orderBy: desc(prayerRequests.createdAt),
    })
  }
}
