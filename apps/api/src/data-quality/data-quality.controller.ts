import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { DataQualityService } from './data-quality.service'

@Controller('data-quality')
@UseGuards(ChurchContextGuard)
export class DataQualityController {
  constructor(private readonly service: DataQualityService) {}

  @Post('imports/preview')
  @RequirePermission('manage:data-quality')
  async previewImport(@Req() request: Request, @Body() body: { fileName: string; format: 'csv' | 'xlsx'; content: string; columnMapping: Record<string, string>; mode: 'create_only' | 'update_only' | 'create_and_update' }) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    if (!body?.fileName || !body?.content) throw new BadRequestException('fileName and content are required')
    return this.service.previewImport(churchId, userId, body)
  }

  @Post('imports/:id/commit')
  @RequirePermission('manage:data-quality')
  async commitImport(@Req() request: Request, @Param('id') importJobId: string, @Body() body: { mode: 'create_only' | 'update_only' | 'create_and_update'; idempotencyKey: string }) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    if (!body?.idempotencyKey) throw new BadRequestException('idempotencyKey is required')
    return this.service.commitImport(churchId, userId, importJobId, body.mode, body.idempotencyKey)
  }

  @Get('imports')
  @RequirePermission('view:data-quality')
  async listImportJobs(@Req() request: Request) {
    return this.service.listImportJobs(request['churchId'] as string)
  }

  @Get('imports/:id')
  @RequirePermission('view:data-quality')
  async getImportJob(@Req() request: Request, @Param('id') importJobId: string) {
    return this.service.getImportJobDetail(request['churchId'] as string, importJobId)
  }

  @Post('duplicates/refresh')
  @RequirePermission('manage:data-quality')
  async refreshDuplicates(@Req() request: Request) {
    return this.service.refreshDuplicateCandidates(request['churchId'] as string, request.user['id'] as string)
  }

  @Get('duplicates')
  @RequirePermission('view:data-quality')
  async listDuplicates(@Req() request: Request) {
    return this.service.listDuplicateCandidates(request['churchId'] as string)
  }

  @Post('duplicates/:id/resolve')
  @RequirePermission('manage:data-quality')
  async resolveDuplicate(@Req() request: Request, @Param('id') candidateId: string, @Body() body: { decision: 'approve' | 'decline' | 'ignore' }) {
    if (!body?.decision) throw new BadRequestException('decision is required')
    return this.service.resolveDuplicateCandidate(request['churchId'] as string, request.user['id'] as string, candidateId, body.decision)
  }
}
