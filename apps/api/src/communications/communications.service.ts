import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm'
import { db } from '@church/db'
import {
  campaignEvents,
  campaignRecipients,
  campaigns,
  memberZones,
  members,
  messageDeliveries,
  messageTemplates,
  zones,
} from '@church/db'
import { MailService } from '../mail/mail.service'
import { SmsService } from '../sms/sms.service'

type CampaignChannel = 'sms' | 'email'
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled'

type AudienceFilters = {
  zoneIds?: string[]
  genders?: Array<'male' | 'female' | 'others'>
  maritalStatuses?: Array<'single' | 'married' | 'divorced' | 'widowed'>
  includeMembersWithoutPhone?: boolean
  includeMembersWithoutEmail?: boolean
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function extractVariables(input: string): string[] {
  const matches = input.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []
  return [...new Set(matches.map((token) => token.replace(/\{|\}|\s/g, '')))]
}

function applyTemplate(input: string, vars: Record<string, string | number | null | undefined>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name) => {
    const value = vars[name]
    return value === undefined || value === null ? '' : String(value)
  })
}

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
  ) {}

  async createTemplate(churchId: string, userId: string, input: { name: string; channel: CampaignChannel; subject?: string; body: string; isActive?: boolean }) {
    if (input.channel === 'email' && !input.subject?.trim()) {
      throw new BadRequestException('Email template subject is required')
    }

    const [template] = await db.insert(messageTemplates).values({
      churchId,
      createdBy: userId,
      name: input.name.trim(),
      channel: input.channel,
      subject: input.subject?.trim(),
      body: input.body,
      variables: JSON.stringify(extractVariables(`${input.subject || ''}\n${input.body}`)),
      isActive: input.isActive ?? true,
    }).returning()

    await this.logEvent(churchId, null, 'template_created', `Template created: ${template.name}`)
    return template
  }

  async listTemplates(churchId: string, channel?: CampaignChannel) {
    const filters = [eq(messageTemplates.churchId, churchId), isNull(messageTemplates.deletedAt)]
    if (channel) filters.push(eq(messageTemplates.channel, channel))

    return db.query.messageTemplates.findMany({
      where: and(...filters),
      orderBy: [desc(messageTemplates.createdAt)],
    })
  }

  async updateTemplate(churchId: string, templateId: string, input: { name?: string; subject?: string; body?: string; isActive?: boolean }) {
    const [existing] = await db.query.messageTemplates.findMany({
      where: and(eq(messageTemplates.id, templateId), eq(messageTemplates.churchId, churchId), isNull(messageTemplates.deletedAt)),
    })
    if (!existing) throw new NotFoundException('Template not found')

    const subject = input.subject ?? existing.subject
    const body = input.body ?? existing.body
    const [updated] = await db.update(messageTemplates).set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      variables: JSON.stringify(extractVariables(`${subject || ''}\n${body}`)),
      updatedAt: new Date(),
    }).where(eq(messageTemplates.id, templateId)).returning()

    return updated
  }

  async previewTemplate(input: { subject?: string; body: string; variables?: Record<string, string> }) {
    const variables = input.variables || {}
    return {
      subject: input.subject ? applyTemplate(input.subject, variables) : null,
      body: applyTemplate(input.body, variables),
      requiredVariables: extractVariables(`${input.subject || ''}\n${input.body}`),
    }
  }

  async createCampaign(churchId: string, userId: string, input: {
    name: string
    channel: CampaignChannel
    templateId?: string
    subject?: string
    body?: string
    audienceFilters?: AudienceFilters
    scheduledAt?: string
  }) {
    let subject = input.subject || null
    let body = input.body || ''

    if (input.templateId) {
      const [template] = await db.query.messageTemplates.findMany({
        where: and(
          eq(messageTemplates.id, input.templateId),
          eq(messageTemplates.churchId, churchId),
          isNull(messageTemplates.deletedAt),
        ),
      })
      if (!template) throw new BadRequestException('Template not found for church')
      if (template.channel !== input.channel) throw new BadRequestException('Template channel mismatch')
      subject = template.subject
      body = template.body
    }

    if (!body.trim()) throw new BadRequestException('Campaign body is required')
    if (input.channel === 'email' && !subject?.trim()) {
      throw new BadRequestException('Email campaign subject is required')
    }

    const status: CampaignStatus = input.scheduledAt ? 'scheduled' : 'draft'
    const [campaign] = await db.insert(campaigns).values({
      churchId,
      templateId: input.templateId,
      name: input.name.trim(),
      channel: input.channel,
      subject,
      body,
      audienceFilters: JSON.stringify(input.audienceFilters || {}),
      status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      createdBy: userId,
    }).returning()

    await this.logEvent(churchId, campaign.id, 'campaign_created', `Campaign created with status ${status}`)
    return campaign
  }

  async updateCampaign(churchId: string, campaignId: string, input: {
    name?: string
    subject?: string
    body?: string
    audienceFilters?: AudienceFilters
    scheduledAt?: string | null
  }) {
    const [existing] = await this.getCampaignRows(churchId, campaignId)
    if (!existing) throw new NotFoundException('Campaign not found')
    if (!['draft', 'scheduled'].includes(existing.status)) {
      throw new BadRequestException('Only draft/scheduled campaigns can be edited')
    }

    const [updated] = await db.update(campaigns).set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.audienceFilters !== undefined ? { audienceFilters: JSON.stringify(input.audienceFilters || {}) } : {}),
      ...(input.scheduledAt !== undefined
        ? {
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            status: input.scheduledAt ? 'scheduled' : 'draft',
          }
        : {}),
      updatedAt: new Date(),
    }).where(eq(campaigns.id, campaignId)).returning()

    return updated
  }

  async listCampaigns(churchId: string, filters: { status?: CampaignStatus; channel?: CampaignChannel; from?: string; to?: string }) {
    const where = [eq(campaigns.churchId, churchId), isNull(campaigns.deletedAt)]
    if (filters.status) where.push(eq(campaigns.status, filters.status))
    if (filters.channel) where.push(eq(campaigns.channel, filters.channel))
    if (filters.from) where.push(gte(campaigns.createdAt, new Date(filters.from)))
    if (filters.to) where.push(lte(campaigns.createdAt, new Date(filters.to)))

    return db.query.campaigns.findMany({
      where: and(...where),
      orderBy: [desc(campaigns.createdAt)],
    })
  }

  async getCampaignDetail(churchId: string, campaignId: string) {
    const [campaign] = await this.getCampaignRows(churchId, campaignId)
    if (!campaign) throw new NotFoundException('Campaign not found')

    const recipients = await db.query.campaignRecipients.findMany({
      where: eq(campaignRecipients.campaignId, campaignId),
      orderBy: [asc(campaignRecipients.createdAt)],
    })

    const deliveries = await db.query.messageDeliveries.findMany({
      where: eq(messageDeliveries.campaignId, campaignId),
      orderBy: [asc(messageDeliveries.createdAt)],
    })

    const events = await db.query.campaignEvents.findMany({
      where: eq(campaignEvents.campaignId, campaignId),
      orderBy: [asc(campaignEvents.createdAt)],
    })

    const analytics = await this.getCampaignAnalytics(campaignId)

    return {
      campaign,
      recipients,
      deliveries,
      events,
      analytics,
    }
  }

  async scheduleCampaign(churchId: string, campaignId: string, scheduledAt: string) {
    const [campaign] = await this.getCampaignRows(churchId, campaignId)
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (!['draft', 'scheduled'].includes(campaign.status)) throw new BadRequestException('Only draft/scheduled campaigns can be scheduled')

    const [updated] = await db.update(campaigns).set({
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt),
      updatedAt: new Date(),
    }).where(eq(campaigns.id, campaignId)).returning()

    await this.logEvent(churchId, campaignId, 'campaign_scheduled', `Scheduled for ${scheduledAt}`)
    return updated
  }

  async sendNow(churchId: string, campaignId: string) {
    await this.processCampaign(churchId, campaignId)
    return this.getCampaignDetail(churchId, campaignId)
  }

  async cancelCampaign(churchId: string, campaignId: string) {
    const [campaign] = await this.getCampaignRows(churchId, campaignId)
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      throw new BadRequestException('Only draft/scheduled campaigns can be cancelled')
    }

    const [updated] = await db.update(campaigns).set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(campaigns.id, campaignId)).returning()

    await this.logEvent(churchId, campaignId, 'campaign_cancelled', 'Campaign cancelled')
    return updated
  }

  private async getCampaignRows(churchId: string, campaignId: string) {
    return db.query.campaigns.findMany({
      where: and(eq(campaigns.id, campaignId), eq(campaigns.churchId, churchId), isNull(campaigns.deletedAt)),
    })
  }

  private async resolveRecipients(churchId: string, channel: CampaignChannel, audienceFiltersRaw: string) {
    const audienceFilters = parseJson<AudienceFilters>(audienceFiltersRaw, {})

    const baseRows = await db.select({
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      phone: members.phone,
      gender: members.gender,
      maritalStatus: members.maritalStatus,
      zoneId: memberZones.zoneId,
      zoneName: zones.name,
    })
      .from(members)
      .leftJoin(memberZones, eq(memberZones.memberId, members.id))
      .leftJoin(zones, eq(memberZones.zoneId, zones.id))
      .where(and(eq(members.churchId, churchId), isNull(members.deletedAt)))

    const zoneFilter = audienceFilters.zoneIds && audienceFilters.zoneIds.length > 0 ? new Set(audienceFilters.zoneIds) : null
    const genderFilter = audienceFilters.genders && audienceFilters.genders.length > 0 ? new Set(audienceFilters.genders) : null
    const maritalFilter = audienceFilters.maritalStatuses && audienceFilters.maritalStatuses.length > 0 ? new Set(audienceFilters.maritalStatuses) : null

    const output: Array<{
      memberId: string
      fullName: string
      zoneName: string | null
      gender: string | null
      maritalStatus: string | null
      recipientAddress: string
      status: 'pending' | 'skipped'
      skipReason: string | null
    }> = []

    const dedupe = new Set<string>()

    for (const row of baseRows) {
      if (zoneFilter && (!row.zoneId || !zoneFilter.has(row.zoneId))) continue
      if (genderFilter && (!row.gender || !genderFilter.has(row.gender as any))) continue
      if (maritalFilter && (!row.maritalStatus || !maritalFilter.has(row.maritalStatus as any))) continue

      const fullName = `${row.firstName} ${row.lastName}`.trim()
      const recipientAddress = channel === 'sms' ? (row.phone || '').trim() : ''

      if (channel === 'email') {
        output.push({
          memberId: row.memberId,
          fullName,
          zoneName: row.zoneName || null,
          gender: row.gender || null,
          maritalStatus: row.maritalStatus || null,
          recipientAddress: '',
          status: 'skipped',
          skipReason: 'Member email not available in current profile schema',
        })
        continue
      }

      if (!recipientAddress) {
        output.push({
          memberId: row.memberId,
          fullName,
          zoneName: row.zoneName || null,
          gender: row.gender || null,
          maritalStatus: row.maritalStatus || null,
          recipientAddress: '',
          status: 'skipped',
          skipReason: 'Missing phone number',
        })
        continue
      }

      if (dedupe.has(recipientAddress)) continue
      dedupe.add(recipientAddress)

      output.push({
        memberId: row.memberId,
        fullName,
        zoneName: row.zoneName || null,
        gender: row.gender || null,
        maritalStatus: row.maritalStatus || null,
        recipientAddress,
        status: 'pending',
        skipReason: null,
      })
    }

    return output
  }

  private async materializeRecipients(campaignRow: typeof campaigns.$inferSelect) {
    const existing = await db.query.campaignRecipients.findMany({ where: eq(campaignRecipients.campaignId, campaignRow.id), limit: 1 })
    if (existing.length > 0) return

    const resolved = await this.resolveRecipients(campaignRow.churchId, campaignRow.channel as CampaignChannel, campaignRow.audienceFilters)

    if (resolved.length === 0) {
      await this.logEvent(campaignRow.churchId, campaignRow.id, 'no_recipients', 'Audience resolved no recipients')
      return
    }

    await db.insert(campaignRecipients).values(
      resolved.map((row) => ({
        campaignId: campaignRow.id,
        churchId: campaignRow.churchId,
        memberId: row.memberId,
        fullName: row.fullName,
        zoneName: row.zoneName,
        gender: row.gender,
        maritalStatus: row.maritalStatus,
        recipientAddress: row.recipientAddress || `${row.memberId}-missing-address`,
        status: row.status,
        skipReason: row.skipReason,
      }))
    )
  }

  private async processCampaign(churchId: string, campaignId: string) {
    const [campaign] = await this.getCampaignRows(churchId, campaignId)
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (!['draft', 'scheduled'].includes(campaign.status)) {
      throw new BadRequestException(`Campaign status ${campaign.status} cannot be sent`)
    }

    await db.update(campaigns).set({
      status: 'sending',
      startedAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: campaign.scheduledAt,
    }).where(eq(campaigns.id, campaign.id))

    await this.logEvent(churchId, campaign.id, 'campaign_sending', 'Campaign sending started')

    await this.materializeRecipients(campaign)

    const recipients = await db.query.campaignRecipients.findMany({ where: eq(campaignRecipients.campaignId, campaign.id) })

    if (recipients.length === 0) {
      await db.update(campaigns).set({ status: 'failed', completedAt: new Date(), updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
      await this.logEvent(churchId, campaign.id, 'campaign_failed', 'No recipients resolved')
      return
    }

    for (const recipient of recipients) {
      if (recipient.status === 'skipped') {
        await db.insert(messageDeliveries).values({
          campaignId: campaign.id,
          recipientId: recipient.id,
          churchId,
          channel: campaign.channel,
          status: 'skipped',
          failureReason: recipient.skipReason || 'Skipped',
          providerResponse: recipient.skipReason || 'Skipped',
          sentAt: new Date(),
        })
        continue
      }

      const memberVars = {
        first_name: recipient.fullName.split(' ')[0] || recipient.fullName,
        full_name: recipient.fullName,
        zone_name: recipient.zoneName || '',
      }
      const subject = campaign.subject ? applyTemplate(campaign.subject, memberVars) : ''
      const body = applyTemplate(campaign.body, memberVars)

      if (campaign.channel === 'sms') {
        const smsResponse = await this.smsService.sendSms({
          userId: campaign.createdBy || '00000000-0000-0000-0000-000000000000',
          to: recipient.recipientAddress,
          message: body,
          category: 'MARKETING',
          purpose: `campaign:${campaign.id}`,
          showInApp: false,
          customReference: `CMP-${campaign.id.slice(0, 8)}-${Date.now()}`,
        })

        await db.insert(messageDeliveries).values({
          campaignId: campaign.id,
          recipientId: recipient.id,
          churchId,
          channel: 'sms',
          providerMessageId: smsResponse.reference,
          status: smsResponse.success ? 'sent' : 'failed',
          failureReason: smsResponse.success ? null : smsResponse.error || 'SMS failed',
          providerResponse: JSON.stringify(smsResponse.response || {}),
          sentAt: new Date(),
          deliveredAt: smsResponse.success ? new Date() : null,
        })

        await db.update(campaignRecipients).set({
          status: smsResponse.success ? 'sent' : 'failed',
        }).where(eq(campaignRecipients.id, recipient.id))
      }

      if (campaign.channel === 'email') {
        const emailResponse = await this.mailService.sendEmail({
          to: recipient.recipientAddress,
          subject,
          html: body,
          text: body,
        })

        await db.insert(messageDeliveries).values({
          campaignId: campaign.id,
          recipientId: recipient.id,
          churchId,
          channel: 'email',
          providerMessageId: emailResponse.messageId,
          status: emailResponse.success ? 'sent' : 'failed',
          failureReason: emailResponse.success ? null : emailResponse.error || 'Email failed',
          providerResponse: JSON.stringify(emailResponse),
          sentAt: new Date(),
          deliveredAt: emailResponse.success ? new Date() : null,
        })

        await db.update(campaignRecipients).set({
          status: emailResponse.success ? 'sent' : 'failed',
        }).where(eq(campaignRecipients.id, recipient.id))
      }
    }

    const analytics = await this.getCampaignAnalytics(campaign.id)
    const finalStatus: CampaignStatus = analytics.totalSent + analytics.totalDelivered > 0 ? 'completed' : 'failed'

    await db.update(campaigns).set({
      status: finalStatus,
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(campaigns.id, campaign.id))

    await this.logEvent(churchId, campaign.id, 'campaign_completed', `Campaign completed with status ${finalStatus}`)
  }

  private async getCampaignAnalytics(campaignId: string) {
    const rows = await db.select({ status: messageDeliveries.status, failureReason: messageDeliveries.failureReason })
      .from(messageDeliveries)
      .where(eq(messageDeliveries.campaignId, campaignId))

    const totals = {
      totalTargeted: rows.length,
      totalPending: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalBounced: 0,
      totalSkipped: 0,
      recentFailureReasons: [] as string[],
    }

    for (const row of rows) {
      if (row.status === 'pending') totals.totalPending += 1
      if (row.status === 'sent') totals.totalSent += 1
      if (row.status === 'delivered') totals.totalDelivered += 1
      if (row.status === 'failed') totals.totalFailed += 1
      if (row.status === 'bounced') totals.totalBounced += 1
      if (row.status === 'skipped') totals.totalSkipped += 1
      if (row.failureReason && totals.recentFailureReasons.length < 5) {
        totals.recentFailureReasons.push(row.failureReason)
      }
    }

    return totals
  }

  private async logEvent(churchId: string, campaignId: string | null, eventType: string, details: string) {
    if (!campaignId) return
    await db.insert(campaignEvents).values({
      campaignId,
      churchId,
      eventType,
      details,
    })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCampaigns() {
    const now = new Date()
    const due = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.status, 'scheduled'),
        lte(campaigns.scheduledAt, now),
        isNull(campaigns.deletedAt),
      ),
      orderBy: [asc(campaigns.scheduledAt)],
      limit: 20,
    })

    for (const campaign of due) {
      try {
        await this.processCampaign(campaign.churchId, campaign.id)
      } catch (error) {
        await db.update(campaigns).set({
          status: 'failed',
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(campaigns.id, campaign.id))

        await this.logEvent(campaign.churchId, campaign.id, 'campaign_failed', error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }
}
