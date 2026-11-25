import { Controller, Get, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { Request } from 'express'
import { DashboardService } from './dashboard.service'
import { MembersService } from '../members/members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

@Controller('dashboard')
@UseGuards(ChurchContextGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * GET /dashboard/stats - Church-scoped dashboard counts (read-only)
   */
  @Get('stats')
  @RequirePermission('read:member')
  async stats(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    const scope = await this.membersService.getLeaderScope(
      churchId,
      request.user['id'] as string,
      request.user['role'] as string,
    )
    return this.dashboardService.getStats(churchId, scope)
  }
}
