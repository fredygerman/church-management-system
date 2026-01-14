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
import { MembersService, type CreateMemberInput } from './members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

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
  async create(@Body() input: CreateMemberInput) {
    if (!input.churchId || !input.firstName || !input.lastName || !input.dateOfBirth || !input.gender || !input.maritalStatus) {
      throw new BadRequestException('Missing required fields')
    }

    return this.membersService.createMember(input)
  }

  /**
   * GET /members - List members by church
   */
  @Get()
  @RequirePermission('read:member')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    return this.membersService.getMembersByChurch(churchId)
  }

  /**
   * GET /members/:id - Get single member
   */
  @Get(':id')
  @RequirePermission('read:member')
  async getOne(@Param('id') id: string) {
    const member = await this.membersService.getMemberById(id)
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
    @Param('id') id: string,
    @Body() input: UpdateMemberInput,
  ) {
    return this.membersService.updateMember(id, input)
  }

  /**
   * DELETE /members/:id - Soft delete member
   */
  @Delete(':id')
  @RequirePermission('delete:member')
  async delete(@Param('id') id: string) {
    await this.membersService.deleteMember(id)
    return { message: 'Member deleted successfully' }
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
  async getByZone(@Param('zoneId') zoneId: string) {
    return this.membersService.getMembersByZone(zoneId)
  }

  /**
   * GET /members/family/:familyId - Get members in a family
   */
  @Get('family/:familyId')
  @RequirePermission('view:families')
  async getByFamily(@Param('familyId') familyId: string) {
    return this.membersService.getMembersByFamily(familyId)
  }

  /**
   * GET /members/:id/zones - Get zones for a member
   */
  @Get(':id/zones')
  @RequirePermission('read:member')
  async getMemberZones(@Param('id') id: string) {
    return this.membersService.getMemberZones(id)
  }

  /**
   * POST /members/:id/assign-zone - Assign to Zone
   */
  @Post(':id/assign-zone')
  @RequirePermission('manage:zones')
  async assignToZone(
    @Param('id') id: string,
    @Body('zoneId') zoneId: string,
  ) {
    if (!zoneId) {
      throw new BadRequestException('zoneId is required')
    }

    return this.membersService.assignToZone(id, zoneId)
  }

  /**
   * POST /members/:id/link-family - Link to family
   */
  @Post(':id/link-family')
  @RequirePermission('manage:families')
  async linkToFamily(
    @Param('id') id: string,
    @Body('familyId') familyId: string,
  ) {
    if (!familyId) {
      throw new BadRequestException('familyId is required')
    }

    return this.membersService.linkToFamily(id, familyId)
  }
}
