import { Injectable, NotFoundException } from '@nestjs/common'
import { and, ilike, isNotNull, isNull, or, eq } from 'drizzle-orm'
import { db, events, publicChurchProfiles } from '@church/db'

export interface PublicChurchQuery {
  limit?: number
  offset?: number
  query?: string
}

export interface PublicChurchSummary {
  publicId: string
  name: string
  location: string | null
  about: string | null
  imageUrl: string | null
}

export interface PublicChurchDetail extends PublicChurchSummary {
  contact: {
    phone: string | null
    email: string | null
  }
  events: Array<{
    id: string
    title: string
    description: string | null
    location: string | null
    startsAt: Date
    endsAt: Date | null
  }>
}

@Injectable()
export class PublicChurchService {
  async listChurches(input: PublicChurchQuery = {}) {
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)
    const offset = Math.max(input.offset ?? 0, 0)
    const profiles = await db.query.publicChurchProfiles.findMany({
      where: and(
        isNull(publicChurchProfiles.deletedAt),
        isNotNull(publicChurchProfiles.publishedAt),
        input.query
          ? or(
              ilike(publicChurchProfiles.name, `%${input.query}%`),
              ilike(publicChurchProfiles.location, `%${input.query}%`),
            )
          : undefined,
      ),
      limit: limit + 1,
      offset,
    })

    const page = profiles.slice(0, limit)
    return {
      items: page.map((profile: any) => this.toSummary(profile)),
      pagination: {
        limit,
        offset,
        hasNext: profiles.length > limit,
      },
    }
  }

  async getChurch(publicId: string): Promise<PublicChurchDetail> {
    const [profile] = await db.query.publicChurchProfiles.findMany({
      where: and(
        eq(publicChurchProfiles.publicId, publicId),
        isNull(publicChurchProfiles.deletedAt),
        isNotNull(publicChurchProfiles.publishedAt),
      ),
      limit: 1,
    })
    if (!profile) throw new NotFoundException('Church not found')

    const publicEvents = await db.query.events.findMany({
      where: and(
        eq(events.churchId, profile.churchId),
        eq(events.status, 'published'),
        isNotNull(events.publicPublishedAt),
        isNull(events.deletedAt),
      ),
    })

    return {
      ...this.toSummary(profile),
      contact: {
        phone: profile.contactPhone,
        email: profile.contactEmail,
      },
      events: publicEvents.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      })),
    }
  }

  private toSummary(profile: any): PublicChurchSummary {
    return {
      publicId: profile.publicId,
      name: profile.name,
      location: profile.location,
      about: profile.about,
      imageUrl: profile.imageUrl,
    }
  }
}
