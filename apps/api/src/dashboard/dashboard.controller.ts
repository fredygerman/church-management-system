import { Controller, Get, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { Request } from 'express'
import { DashboardService } from './dashboard.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

@Controller('dashboard')
@UseGuards(ChurchContextGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
    return this.dashboardService.getStats(churchId)
  }
}
