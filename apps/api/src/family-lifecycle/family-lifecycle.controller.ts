import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { FamilyLifecycleService } from './family-lifecycle.service'

@Controller('family-lifecycle')
@UseGuards(ChurchContextGuard)
export class FamilyLifecycleController {
  constructor(private readonly service: FamilyLifecycleService) {}

  @Post('relationships')
  @RequirePermission('manage:families')
  async createRelationship(@Req() request: Request, @Body() body: { familyId: string; memberId: string; role: 'head' | 'spouse' | 'child' | 'guardian' | 'other'; status?: 'pending' | 'confirmed' }) {
    if (!body?.familyId || !body?.memberId || !body?.role) throw new BadRequestException('familyId, memberId and role are required')
    return this.service.createRelationship(request['churchId'] as string, request.user['id'] as string, body)
  }

  @Delete('relationships/:id')
  @RequirePermission('manage:families')
  async removeRelationship(@Req() request: Request, @Param('id') relationshipId: string) {
    return this.service.removeRelationship(request['churchId'] as string, relationshipId)
  }

  @Get('relationships')
  @RequirePermission('view:families')
  async listRelationships(@Req() request: Request, @Query('familyId') familyId?: string) {
    return this.service.listRelationships(request['churchId'] as string, familyId)
  }

  @Post('rules')
  @RequirePermission('manage:lifecycle-rules')
  async createRule(@Req() request: Request, @Body() body: { milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; customMilestoneName?: string; channel: 'sms' | 'email'; notifyTarget: 'member' | 'family_head' | 'leader' | 'admin'; leadDays: string; isActive?: boolean }) {
    return this.service.createMilestoneRule(request['churchId'] as string, body)
  }

  @Get('rules')
  @RequirePermission('view:lifecycle-dashboard')
  async listRules(@Req() request: Request) {
    return this.service.listMilestoneRules(request['churchId'] as string)
  }

  @Post('milestones')
  @RequirePermission('manage:lifecycle-rules')
  async createMilestone(@Req() request: Request, @Body() body: { memberId: string; familyId?: string; milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; label: string; milestoneDate: string; notificationRuleId?: string; details?: string }) {
    return this.service.createLifecycleMilestone(request['churchId'] as string, body)
  }

  @Get('milestones')
  @RequirePermission('view:lifecycle-dashboard')
  async listMilestones(@Req() request: Request, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.listLifecycleMilestones(request['churchId'] as string, from, to)
  }

  @Get('suggestions')
  @RequirePermission('view:lifecycle-dashboard')
  async listSuggestions(@Req() request: Request) {
    return this.service.listSuggestions(request['churchId'] as string)
  }

  @Post('suggestions/:id/resolve')
  @RequirePermission('manage:families')
  async resolveSuggestion(@Req() request: Request, @Param('id') suggestionId: string, @Body() body: { decision: 'approved' | 'declined' | 'ignored' }) {
    if (!body?.decision) throw new BadRequestException('decision is required')
    return this.service.resolveSuggestion(request['churchId'] as string, suggestionId, body.decision)
  }

  @Get('dashboard')
  @RequirePermission('view:lifecycle-dashboard')
  async getDashboard(@Req() request: Request) {
    return this.service.getDashboard(request['churchId'] as string)
  }
}
