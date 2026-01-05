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
  UseGuards,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import { ZonesService, type CreateZoneInput } from './zones.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

export type UpdateZoneInput = Partial<CreateZoneInput>

@Controller('zones')
@UseGuards(ChurchContextGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /**
   * POST /zones - Create new zone (Jumuiya)
   */
  @Post()
  @RequirePermission('manage:zones')
  async create(@Body() input: CreateZoneInput) {
    if (!input.churchId || !input.name) {
      throw new BadRequestException('Missing required fields: churchId, name')
    }

    return this.zonesService.createZone(input)
  }

  /**
   * GET /zones - List zones by church
   */
  @Get()
  @RequirePermission('manage:zones')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    return this.zonesService.getZonesByChurch(churchId)
  }

  /**
   * GET /zones/:id - Get single zone
   */
  @Get(':id')
  @RequirePermission('manage:zones')
  async getOne(@Param('id') id: string) {
    const zone = await this.zonesService.getZoneById(id)
    if (!zone) {
      throw new BadRequestException(`Zone with ID ${id} not found`)
    }
    return zone
  }

  /**
   * PUT /zones/:id - Update zone
   */
  @Put(':id')
  @RequirePermission('manage:zones')
  async update(
    @Param('id') id: string,
    @Body() input: UpdateZoneInput,
  ) {
    return this.zonesService.updateZone(id, input)
  }

  /**
   * DELETE /zones/:id - Soft delete zone
   */
  @Delete(':id')
  @RequirePermission('manage:zones')
  async delete(@Param('id') id: string) {
    await this.zonesService.deleteZone(id)
    return { message: 'Zone deleted successfully' }
  }

  /**
   * POST /zones/:id/assign-leader - Assign leader to zone
   */
  @Post(':id/assign-leader')
  @RequirePermission('manage:zones')
  async assignLeader(
    @Param('id') id: string,
    @Body('leaderId') leaderId: string,
  ) {
    if (!leaderId) {
      throw new BadRequestException('leaderId is required')
    }

    return this.zonesService.assignLeader(id, leaderId)
  }

  /**
   * GET /zones/by-meeting-day - Get zones by meeting day
   */
  @Get('by-meeting-day')
  @RequirePermission('manage:zones')
  async getByMeetingDay(
    @Query('churchId') churchId: string,
    @Query('meetingDay') meetingDay: string,
  ) {
    if (!churchId || !meetingDay) {
      throw new BadRequestException('churchId and meetingDay are required')
    }

    return this.zonesService.getZonesByMeetingDay(churchId, meetingDay)
  }
}
