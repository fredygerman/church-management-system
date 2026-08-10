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
import { MembersService, type CreateMemberInput } from './members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { UserRole } from '../auth/types/permission.types'

export type UpdateMemberInput = Partial<CreateMemberInput>

@Controller('members')
@UseGuards(ChurchContextGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /**
   * POST /members - Create new member
   */
  @Post()
  @RequirePermission('create:member')
  async create(@Req() request: Request, @Body() input: CreateMemberInput) {
    const churchId = request['churchId'] as string
    if (!churchId || !input.firstName || !input.lastName || !input.dateOfBirth || !input.gender || !input.maritalStatus) {
      throw new BadRequestException('Missing required fields')
    }

    return this.membersService.createMember({ ...input, churchId })
  }

  /**
   * GET /members - List members by church
   */
  @Get()
  @RequirePermission('read:member')
  async list(
    @Req() request: Request,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    let limit: number | undefined
    let offset: number | undefined

    if (limitStr) {
      limit = parseInt(limitStr, 10)
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestException('limit must be a positive integer')
      }
    }

    if (offsetStr) {
      offset = parseInt(offsetStr, 10)
      if (!Number.isInteger(offset) || offset < 0) {
        throw new BadRequestException('offset must be a non-negative integer')
      }
    }

    return this.membersService.getMembersByChurch(churchId, limit, offset)
  }

  /**
   * GET /members/search - Search members
   */
  @Get('search')
  @RequirePermission('read:member')
  async search(
    @Req() request: Request,
    @Query('q') query: string,
  ) {
    const churchId = request['churchId'] as string
    if (!churchId || !query) {
      throw new BadRequestException('Church context and search query are required')
    }

    return this.membersService.searchMembers(churchId, query)
  }

  /**
   * GET /members/zone/:zoneId - Get members in a zone
   */
  @Get('zone/:zoneId')
  @RequirePermission('read:member')
  async getByZone(@Req() request: Request, @Param('zoneId') zoneId: string) {
    return this.membersService.getMembersByZone(request['churchId'] as string, zoneId)
  }

  /**
   * GET /members/family/:familyId - Get members in a family
   */
  @Get('family/:familyId')
  @RequirePermission('view:families')
  async getByFamily(@Req() request: Request, @Param('familyId') familyId: string) {
    return this.membersService.getMembersByFamily(request['churchId'] as string, familyId)
  }

  /**
   * GET /members/me - Get the caller's own member record for this church (self-service)
   */
  @Get('me')
  @RequirePermission('read:self')
  async getMe(@Req() request: Request) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    return (await this.membersService.getMemberByUserId(churchId, userId)) ?? null
  }

  /**
   * GET /members/:id - Get single member
   */
  @Get(':id')
  @RequirePermission('read:member')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const churchId = request['churchId'] as string

    // The MEMBER role's read:member grant is "own profile only" (see permissions.ts) —
    // enforce that here since the permission system itself is action-based, not row-scoped.
    if (request.user['role'] === UserRole.MEMBER) {
      const ownMember = await this.membersService.getMemberByUserId(churchId, request.user['id'] as string)
      if (!ownMember || ownMember.id !== id) {
        throw new ForbiddenException('You can only view your own member profile')
      }
    }

    const member = await this.membersService.getMemberById(churchId, id)
    if (!member) {
      throw new BadRequestException(`Member with ID ${id} not found`)
    }
    return member
  }

  /**
   * PUT /members/:id - Update member
   */
  @Put(':id')
  @RequirePermission('update:member')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() input: UpdateMemberInput,
  ) {
    return this.membersService.updateMember(request['churchId'] as string, id, input)
  }

  /**
   * DELETE /members/:id - Soft delete member
   */
  @Delete(':id')
  @RequirePermission('delete:member')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.membersService.deleteMember(request['churchId'] as string, id)
    return { message: 'Member deleted successfully' }
  }

  /**
   * GET /members/:id/zones - Get zones for a member
   */
  @Get(':id/zones')
  @RequirePermission('read:member')
  async getMemberZones(@Req() request: Request, @Param('id') id: string) {
    return this.membersService.getMemberZones(request['churchId'] as string, id)
  }

  /**
   * POST /members/:id/assign-zone - Assign to Zone
   */
  @Post(':id/assign-zone')
  @RequirePermission('manage:zones')
  async assignToZone(
    @Req() request: Request,
    @Param('id') id: string,
    @Body('zoneId') zoneId: string,
  ) {
    if (!zoneId) {
      throw new BadRequestException('zoneId is required')
    }

    return this.membersService.assignToZone(request['churchId'] as string, id, zoneId)
  }

  /**
   * POST /members/:id/link-family - Link to family
   */
  @Post(':id/link-family')
  @RequirePermission('manage:families')
  async linkToFamily(
    @Req() request: Request,
    @Param('id') id: string,
    @Body('familyId') familyId: string,
  ) {
    if (!familyId) {
      throw new BadRequestException('familyId is required')
    }

    return this.membersService.linkToFamily(request['churchId'] as string, id, familyId)
  }
}
