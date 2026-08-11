import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import { parsePagination } from '../helpers/pagination.helper'
import {
  EventsService,
  type CreateEventInput,
  type UpdateEventInput,
  type EventStatus,
  type EventScope,
  type StaffRsvpInput,
  type AttendanceInput,
  type RsvpStatus,
} from './events.service'
import { MembersService } from '../members/members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { roleHasPermission } from '../auth/types/permission.types'

@Controller('events')
@UseGuards(ChurchContextGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * GET /events/me - the caller's own RSVPs, joined to event details
   * (self-service). Declared before GET /events/:id so Nest/Express doesn't
   * try to resolve "me" as an :id.
   */
  @Get('me')
  @RequirePermission('rsvp:event')
  async getMine(@Req() request: Request) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    const member = await this.membersService.getMemberByUserId(churchId, userId)
    if (!member) return []
    return this.eventsService.getMyRsvps(churchId, member.id)
  }

  /**
   * POST /events - create an event. `scope: 'network'` additionally requires
   * manage:network-events - rejected outright (403), never silently
   * downgraded to 'church'.
   */
  @Post()
  @RequirePermission('manage:events')
  async create(@Req() request: Request, @Body() input: CreateEventInput) {
    const churchId = request['churchId'] as string
    if (!input?.title?.trim() || !input?.startsAt) {
      throw new BadRequestException('Missing required fields: title, startsAt')
    }
    if (input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
      throw new BadRequestException('endsAt cannot be earlier than startsAt')
    }
    if (input.scope === 'network') {
      const role = request.user['role'] as any
      if (!roleHasPermission(role, 'manage:network-events')) {
        throw new ForbiddenException('You do not have permission to publish network-wide events')
      }
    }

    return this.eventsService.createEvent({ ...input, churchId })
  }

  /**
   * GET /events - list events visible to the caller's church (own church's
   * events + published network events), filterable by from/to/status/scope.
   */
  @Get()
  @RequirePermission('view:events')
  async list(
    @Req() request: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: EventStatus,
    @Query('scope') scope?: EventScope,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const churchId = request['churchId'] as string
    const { limit, offset } = parsePagination(limitStr, offsetStr)

    return this.eventsService.getEventsByChurch(churchId, { from, to, status, scope }, false, limit, offset)
  }

  /**
   * GET /events/:id - detail. 404 if not visible to the caller's church
   * (owned, or a published network event).
   */
  @Get(':id')
  @RequirePermission('view:events')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const event = await this.eventsService.getEventByIdInChurch(request['churchId'] as string, id)
    if (!event) {
      throw new BadRequestException(`Event with ID ${id} not found`)
    }
    return event
  }

  /**
   * PUT /events/:id - update. Owning church only - a branch admin cannot
   * edit another church's event even if it is visible to them (e.g. a
   * published network event).
   */
  @Put(':id')
  @RequirePermission('manage:events')
  async update(@Req() request: Request, @Param('id') id: string, @Body() input: UpdateEventInput) {
    if (input?.startsAt && input?.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) {
      throw new BadRequestException('endsAt cannot be earlier than startsAt')
    }
    const updated = await this.eventsService.updateEvent(request['churchId'] as string, id, input)
    if (!updated) {
      throw new BadRequestException(`Event with ID ${id} not found`)
    }
    return updated
  }

  /**
   * DELETE /events/:id - soft delete. Owning church only.
   */
  @Delete(':id')
  @RequirePermission('manage:events')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.eventsService.deleteEvent(request['churchId'] as string, id)
    return { message: 'Event deleted successfully' }
  }

  /**
   * GET /events/:id/rsvps - RSVP roster with counts by status, plus a
   * per-branch breakdown for network-scope events.
   */
  @Get(':id/rsvps')
  @RequirePermission('manage:events')
  async getRoster(@Req() request: Request, @Param('id') id: string) {
    const roster = await this.eventsService.getRoster(request['churchId'] as string, id)
    if (!roster) {
      throw new BadRequestException(`Event with ID ${id} not found`)
    }
    return roster
  }

  /**
   * POST /events/:id/rsvps - staff RSVP on a member's behalf, or register a
   * walk-up. Owning church only.
   */
  @Post(':id/rsvps')
  @RequirePermission('manage:events')
  async staffRsvp(@Req() request: Request, @Param('id') id: string, @Body() input: StaffRsvpInput) {
    if (!input?.memberId || !input?.status) {
      throw new BadRequestException('Missing required fields: memberId, status')
    }
    return this.eventsService.staffRsvp(request['churchId'] as string, id, input)
  }

  /**
   * PUT /events/:id/rsvp - self-service RSVP. Resolves the caller's member id,
   * verifies the event is visible and published, then upserts with churchId
   * from the caller's own current church context (not the event's owner).
   */
  @Put(':id/rsvp')
  @RequirePermission('rsvp:event')
  async selfRsvp(@Req() request: Request, @Param('id') id: string, @Body() input: { status: RsvpStatus }) {
    if (!input?.status) {
      throw new BadRequestException('Missing required fields: status')
    }
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    const member = await this.membersService.getMemberByUserId(churchId, userId)
    if (!member) {
      throw new BadRequestException(
        'Your account isn\'t linked to a member profile in this church yet',
      )
    }
    return this.eventsService.rsvp(churchId, member.id, id, input.status)
  }

  /**
   * PUT /events/:id/attendance - mark attendance and/or headcount. Owning
   * church only.
   */
  @Put(':id/attendance')
  @RequirePermission('manage:events')
  async setAttendance(@Req() request: Request, @Param('id') id: string, @Body() input: AttendanceInput) {
    return this.eventsService.setAttendance(request['churchId'] as string, id, input)
  }
}
