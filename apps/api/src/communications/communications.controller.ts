import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { CommunicationsService } from './communications.service'

@Controller('communications')
@UseGuards(ChurchContextGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('templates')
  @RequirePermission('manage:communications')
  async createTemplate(
    @Req() request: Request,
    @Body() body: { name: string; channel: 'sms' | 'email'; subject?: string; body: string; isActive?: boolean },
  ) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    if (!churchId || !userId || !body?.name || !body?.channel || !body?.body) {
      throw new BadRequestException('Missing required fields')
    }
    return this.communicationsService.createTemplate(churchId, userId, body)
  }

  @Get('templates')
  @RequirePermission('view:communications')
  async listTemplates(@Req() request: Request, @Query('channel') channel?: 'sms' | 'email') {
    return this.communicationsService.listTemplates(request['churchId'] as string, channel)
  }

  @Patch('templates/:id')
  @RequirePermission('manage:communications')
  async updateTemplate(
    @Req() request: Request,
    @Param('id') templateId: string,
    @Body() body: { name?: string; subject?: string; body?: string; isActive?: boolean },
  ) {
    return this.communicationsService.updateTemplate(request['churchId'] as string, templateId, body)
  }

  @Post('templates/preview')
  @RequirePermission('manage:communications')
  async previewTemplate(@Body() body: { subject?: string; body: string; variables?: Record<string, string> }) {
    if (!body?.body) throw new BadRequestException('body is required')
    return this.communicationsService.previewTemplate(body)
  }

  @Post('campaigns')
  @RequirePermission('manage:communications')
  async createCampaign(
    @Req() request: Request,
    @Body() body: {
      name: string
      channel: 'sms' | 'email'
      templateId?: string
      subject?: string
      body?: string
      audienceFilters?: Record<string, any>
      scheduledAt?: string
    },
  ) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    return this.communicationsService.createCampaign(churchId, userId, body)
  }

  @Put('campaigns/:id')
  @RequirePermission('manage:communications')
  async updateCampaign(
    @Req() request: Request,
    @Param('id') campaignId: string,
    @Body() body: {
      name?: string
      subject?: string
      body?: string
      audienceFilters?: Record<string, any>
      scheduledAt?: string | null
    },
  ) {
    return this.communicationsService.updateCampaign(request['churchId'] as string, campaignId, body)
  }

  @Get('campaigns')
  @RequirePermission('view:communications')
  async listCampaigns(
    @Req() request: Request,
    @Query('status') status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled',
    @Query('channel') channel?: 'sms' | 'email',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.communicationsService.listCampaigns(request['churchId'] as string, { status, channel, from, to })
  }

  @Get('campaigns/:id')
  @RequirePermission('view:communications')
  async getCampaign(@Req() request: Request, @Param('id') campaignId: string) {
    return this.communicationsService.getCampaignDetail(request['churchId'] as string, campaignId)
  }

  @Post('campaigns/:id/schedule')
  @RequirePermission('send:communications')
  async scheduleCampaign(@Req() request: Request, @Param('id') campaignId: string, @Body() body: { scheduledAt: string }) {
    if (!body?.scheduledAt) throw new BadRequestException('scheduledAt is required')
    return this.communicationsService.scheduleCampaign(request['churchId'] as string, campaignId, body.scheduledAt)
  }

  @Post('campaigns/:id/send')
  @RequirePermission('send:communications')
  async sendNow(@Req() request: Request, @Param('id') campaignId: string) {
    return this.communicationsService.sendNow(request['churchId'] as string, campaignId)
  }

  @Post('campaigns/:id/cancel')
  @RequirePermission('manage:communications')
  async cancelCampaign(@Req() request: Request, @Param('id') campaignId: string) {
    return this.communicationsService.cancelCampaign(request['churchId'] as string, campaignId)
  }
}
