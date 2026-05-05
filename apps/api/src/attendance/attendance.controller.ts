import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { AttendanceService } from './attendance.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

@Controller('attendance')
@UseGuards(ChurchContextGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('service-types')
  @RequirePermission('manage:services')
  async createServiceType(@Req() request: Request, @Body() body: { name: string; isActive?: boolean }) {
    const churchId = request['churchId'] as string
    if (!churchId || !body?.name?.trim()) {
      throw new BadRequestException('churchId and name are required')
    }
    return this.attendanceService.createServiceType(churchId, body)
  }

  @Get('service-types')
  @RequirePermission('view:attendance')
  async listServiceTypes(@Req() request: Request) {
    return this.attendanceService.listServiceTypes(request['churchId'] as string)
  }

  @Patch('service-types/:id')
  @RequirePermission('manage:services')
  async updateServiceType(@Req() request: Request, @Param('id') serviceTypeId: string, @Body() body: { name?: string; isActive?: boolean }) {
    return this.attendanceService.updateServiceType(request['churchId'] as string, serviceTypeId, body)
  }

  @Post('sessions')
  @RequirePermission('manage:services')
  async createSession(@Req() request: Request, @Body() body: { serviceTypeId: string; title?: string; sessionDate: string }) {
    if (!body?.serviceTypeId || !body?.sessionDate) {
      throw new BadRequestException('serviceTypeId and sessionDate are required')
    }
    return this.attendanceService.createSession(request['churchId'] as string, body)
  }

  @Get('sessions')
  @RequirePermission('view:attendance')
  async listSessions(@Req() request: Request, @Query('from') from?: string, @Query('to') to?: string) {
    return this.attendanceService.listSessions(request['churchId'] as string, from, to)
  }

  @Patch('sessions/:id/status')
  @RequirePermission('manage:services')
  async updateSessionStatus(@Req() request: Request, @Param('id') sessionId: string, @Body() body: { status: 'draft' | 'open' | 'closed' }) {
    if (!body?.status) throw new BadRequestException('status is required')
    return this.attendanceService.updateSessionStatus(request['churchId'] as string, sessionId, body.status)
  }

  @Put('sessions/:id/headcount')
  @RequirePermission('manage:attendance')
  async upsertHeadcount(
    @Req() request: Request,
    @Param('id') sessionId: string,
    @Body() body: { menCount: number; womenCount: number; childrenCount: number; visitorsCount: number },
  ) {
    return this.attendanceService.upsertHeadcount(request['churchId'] as string, sessionId, {
      menCount: Number(body?.menCount || 0),
      womenCount: Number(body?.womenCount || 0),
      childrenCount: Number(body?.childrenCount || 0),
      visitorsCount: Number(body?.visitorsCount || 0),
    })
  }

  @Post('sessions/:id/checkins/manual')
  @RequirePermission('manage:attendance')
  async manualCheckin(@Req() request: Request, @Param('id') sessionId: string, @Body() body: { memberId: string }) {
    if (!body?.memberId) throw new BadRequestException('memberId is required')
    return this.attendanceService.manualCheckin(request['churchId'] as string, sessionId, body.memberId)
  }

  @Post('checkins/qr/:token')
  @RequirePermission('manage:attendance')
  async qrCheckin(@Req() request: Request, @Param('token') token: string, @Body() body: { memberId: string }) {
    if (!body?.memberId) throw new BadRequestException('memberId is required')
    return this.attendanceService.qrCheckin(request['churchId'] as string, token, body.memberId)
  }

  @Get('trends')
  @RequirePermission('view:attendance')
  async trends(
    @Req() request: Request,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: 'branch' | 'zone' | 'gender' | 'age_band',
  ) {
    if (!from || !to || !groupBy) {
      throw new BadRequestException('from, to and groupBy are required')
    }
    return this.attendanceService.getTrends(request['churchId'] as string, { from, to, groupBy })
  }

  @Get('risk-settings')
  @RequirePermission('view:risk-flags')
  async getRiskSettings(@Req() request: Request) {
    return this.attendanceService.getRiskSettings(request['churchId'] as string)
  }

  @Put('risk-settings')
  @RequirePermission('manage:risk-settings')
  async upsertRiskSettings(@Req() request: Request, @Body() body: { consecutiveMissedThreshold: number; isActive: boolean }) {
    if (!body?.consecutiveMissedThreshold || body.consecutiveMissedThreshold < 1) {
      throw new BadRequestException('consecutiveMissedThreshold must be at least 1')
    }
    return this.attendanceService.upsertRiskSettings(request['churchId'] as string, {
      consecutiveMissedThreshold: Number(body.consecutiveMissedThreshold),
      isActive: body.isActive ?? true,
    })
  }

  @Get('risk-flags')
  @RequirePermission('view:risk-flags')
  async getAtRiskMembers(@Req() request: Request) {
    return this.attendanceService.getAtRiskMembers(request['churchId'] as string)
  }

  @Put('sessions/:id/metadata')
  @RequirePermission('manage:attendance-analytics')
  async upsertSessionMetadata(
    @Req() request: Request,
    @Param('id') sessionId: string,
    @Body() body: { cadence: 'weekly' | 'biweekly' | 'monthly' | 'special'; tags: string[]; notes?: string },
  ) {
    return this.attendanceService.upsertSessionMetadata(request['churchId'] as string, sessionId, body)
  }

  @Post('sessions/:id/checkins/manual/batch')
  @RequirePermission('manage:attendance')
  async batchManualCheckin(@Req() request: Request, @Param('id') sessionId: string, @Body() body: { memberIds: string[] }) {
    if (!Array.isArray(body?.memberIds) || body.memberIds.length === 0) throw new BadRequestException('memberIds are required')
    return this.attendanceService.batchManualCheckin(request['churchId'] as string, sessionId, body.memberIds)
  }

  @Get('trends/compare')
  @RequirePermission('manage:attendance-analytics')
  async compareTrends(
    @Req() request: Request,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: 'branch' | 'zone' | 'gender' | 'age_band',
  ) {
    if (!from || !to || !groupBy) throw new BadRequestException('from, to and groupBy are required')
    return this.attendanceService.getPeriodComparison(request['churchId'] as string, { from, to, groupBy })
  }

  @Get('cohorts')
  @RequirePermission('manage:attendance-analytics')
  async getCohorts(@Req() request: Request, @Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) throw new BadRequestException('from and to are required')
    return this.attendanceService.getAttendanceCohorts(request['churchId'] as string, { from, to })
  }

  @Get('sessions/open/health')
  @RequirePermission('manage:attendance-analytics')
  async getOpenSessionHealth(@Req() request: Request) {
    return this.attendanceService.getOpenSessionHealth(request['churchId'] as string)
  }

  @Post('risk-profiles')
  @RequirePermission('manage:risk-settings')
  async createRiskProfile(
    @Req() request: Request,
    @Body() body: { versionLabel: string; missedWeight: number; recencyWeight: number; lowThreshold: number; mediumThreshold: number; highThreshold: number; isActive: number },
  ) {
    return this.attendanceService.upsertRiskProfile(request['churchId'] as string, body)
  }
}
