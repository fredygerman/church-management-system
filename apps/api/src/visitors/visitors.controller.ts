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
import {
  CreateVisitorDto,
  UpdateVisitorDto,
  CreateVisitorFollowupDto,
  ConvertVisitorToMemberDto,
} from './dtos'
import { VisitorsService } from './visitors.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

@Controller('visitors')
@UseGuards(ChurchContextGuard)
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  /**
   * POST /visitors - Create new visitor entry (Sunday intake)
   */
  @Post()
  @RequirePermission('create:visitor')
  async create(@Body() createVisitorDto: CreateVisitorDto) {
    if (!createVisitorDto.churchId || !createVisitorDto.firstName || !createVisitorDto.lastName) {
      throw new BadRequestException('Missing required fields: churchId, firstName, lastName')
    }

    return this.visitorsService.createVisitor({
      ...createVisitorDto,
      visitDate: createVisitorDto.visitDate ? new Date(createVisitorDto.visitDate) : undefined,
    })
  }

  /**
   * GET /visitors - List visitors by church
   */
  @Get()
  @RequirePermission('view:visitors')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    return this.visitorsService.getVisitorsByChurch(churchId)
  }

  /**
   * GET /visitors/:id - Get single visitor
   */
  @Get(':id')
  @RequirePermission('view:visitors')
  async getOne(@Param('id') id: string) {
    const visitor = await this.visitorsService.getVisitorById(id)
    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${id} not found`)
    }
    return visitor
  }

  /**
   * PUT /visitors/:id - Update visitor
   */
  @Put(':id')
  @RequirePermission('update:visitor')
  async update(
    @Param('id') id: string,
    @Body() updateVisitorDto: UpdateVisitorDto,
  ) {
    return this.visitorsService.updateVisitor(id, updateVisitorDto)
  }

  /**
   * DELETE /visitors/:id - Soft delete visitor
   */
  @Delete(':id')
  @RequirePermission('update:visitor')
  async delete(@Param('id') id: string) {
    await this.visitorsService.deleteVisitor(id)
    return { message: 'Visitor deleted successfully' }
  }

  /**
   * POST /visitors/:id/convert - Convert visitor to member
   */
  @Post(':id/convert')
  @RequirePermission('update:visitor')
  async convertToMember(
    @Param('id') id: string,
    @Body() convertVisitorDto: ConvertVisitorToMemberDto,
  ) {
    return this.visitorsService.convertVisitorToMember({
      visitorId: id,
      zoneId: convertVisitorDto.zoneId,
    })
  }

  /**
   * GET /visitors/status/:status - Get visitors by status
   */
  @Get('status/:status')
  @RequirePermission('view:visitors')
  async getByStatus(
    @Param('status') status: string,
    @Query('churchId') churchId: string,
  ) {
    if (!churchId) {
      throw new BadRequestException('churchId query parameter is required')
    }

    return this.visitorsService.getVisitorsByStatus(churchId, status)
  }

  /**
   * POST /visitors/:id/followup - Log followup action
   */
  @Post(':id/followup')
  @RequirePermission('create:visitation')
  async createFollowup(
    @Param('id') id: string,
    @Body() createFollowupDto: CreateVisitorFollowupDto,
  ) {
    if (!createFollowupDto.status) {
      throw new BadRequestException('status is required')
    }

    return this.visitorsService.createFollowup({
      visitorId: id,
      status: createFollowupDto.status,
      notes: createFollowupDto.notes,
      followupDate: createFollowupDto.followupDate ? new Date(createFollowupDto.followupDate) : undefined,
      completedBy: createFollowupDto.completedBy,
    })
  }

  /**
   * GET /visitors/:id/followups - Get followup history
   */
  @Get(':id/followups')
  @RequirePermission('read:visitation')
  async getFollowups(@Param('id') id: string) {
    return this.visitorsService.getFollowupsByVisitor(id)
  }

  /**
   * GET /visitors/:id/latest-followup - Get latest followup status
   */
  @Get(':id/latest-followup')
  @RequirePermission('read:visitation')
  async getLatestFollowup(@Param('id') id: string) {
    return this.visitorsService.getLatestFollowupStatus(id)
  }
}
