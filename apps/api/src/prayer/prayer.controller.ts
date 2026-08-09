import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import { PrayerService } from './prayer.service'
import { MembersService } from '../members/members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

export type CreatePrayerRequestBody = {
  content: string
}

@Controller('prayer-requests')
@UseGuards(ChurchContextGuard)
export class PrayerController {
  constructor(
    private readonly prayerService: PrayerService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * POST /prayer-requests - Submit a prayer request (self-service)
   */
  @Post()
  @RequirePermission('create:prayer-request')
  async create(@Req() request: Request, @Body() input: CreatePrayerRequestBody) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string

    if (!input.content?.trim()) {
      throw new BadRequestException('Prayer request content is required')
    }

    const member = await this.membersService.getMemberByUserId(churchId, userId)
    if (!member) {
      throw new BadRequestException(
        'Your account isn\'t linked to a member profile in this church yet',
      )
    }

    return this.prayerService.createPrayerRequest({
      churchId,
      userId,
      memberId: member.id,
      content: input.content.trim(),
    })
  }

  /**
   * GET /prayer-requests/me - List the caller's own prayer requests (self-service)
   */
  @Get('me')
  @RequirePermission('read:own-prayer-requests')
  async getMine(@Req() request: Request) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    return this.prayerService.getMyPrayerRequests(churchId, userId)
  }
}
