import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import type { UserContext } from '../auth/types/permission.types'
import { AnnouncementsService, type AnnouncementActor } from './announcements.service'
import type { AnnouncementStatus } from './announcements.types'
import { CreateAnnouncementDto, ScheduleAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

const LIST_STATUSES: readonly AnnouncementStatus[] = ['draft', 'pending_approval', 'scheduled', 'published', 'cancelled']

/**
 * Announcements v2 API (lane 05, part A). Tenant and role come from the guard-validated request,
 * never from the body. Members reach GET routes through view:communications; staff through view:announcements.
 */
@Controller('announcements')
@UseGuards(ChurchContextGuard)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @RequirePermission(['view:announcements', 'view:communications'])
  async list(
    @Req() request: Request,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('status') status?: string,
  ) {
    const parsedLimit = limit === undefined ? undefined : Number(limit)
    if (limit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit! < 1)) {
      throw new BadRequestException('limit must be a positive integer')
    }
    if (status !== undefined && !LIST_STATUSES.includes(status as AnnouncementStatus)) {
      throw new BadRequestException('status is not a known announcement status')
    }
    return this.announcements.list(this.actor(request), {
      limit: parsedLimit,
      cursor,
      status: status as AnnouncementStatus | undefined,
    })
  }

  @Get(':id')
  @RequirePermission(['view:announcements', 'view:communications'])
  async get(@Req() request: Request, @Param('id') id: string) {
    return this.announcements.get(this.actor(request), id)
  }

  @Post()
  @RequirePermission('publish:announcements')
  async create(@Req() request: Request, @Body() body: CreateAnnouncementDto) {
    return this.announcements.create(this.actor(request), body)
  }

  @Patch(':id')
  @RequirePermission('publish:announcements')
  async update(@Req() request: Request, @Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return this.announcements.update(this.actor(request), id, body)
  }

  @Post(':id/schedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('publish:announcements')
  async schedule(@Req() request: Request, @Param('id') id: string, @Body() body: ScheduleAnnouncementDto) {
    return this.announcements.schedule(this.actor(request), id, body)
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission('publish:announcements')
  async publish(
    @Req() request: Request,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.announcements.publish(this.actor(request), id, idempotencyKey)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('publish:announcements')
  async cancel(@Req() request: Request, @Param('id') id: string) {
    return this.announcements.cancel(this.actor(request), id)
  }

  private actor(request: Request): AnnouncementActor {
    const user = request.user as UserContext
    return {
      churchId: request['churchId'] as string,
      userId: user.id,
      role: user.role,
    }
  }
}
