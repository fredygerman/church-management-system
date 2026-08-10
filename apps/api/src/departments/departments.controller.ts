import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common'
import { Request } from 'express'
import { DepartmentsService, type CreateDepartmentInput } from './departments.service'
import { MembersService } from '../members/members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { UserRole } from '../auth/types/permission.types'

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>

@Controller('departments')
@UseGuards(ChurchContextGuard)
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * POST /departments - Create new department
   */
  @Post()
  @RequirePermission('manage:departments')
  async create(@Req() request: Request, @Body() input: CreateDepartmentInput) {
    const churchId = request['churchId'] as string
    if (!churchId || !input.name) {
      throw new BadRequestException('Missing required fields: churchId, name')
    }

    return this.departmentsService.createDepartment({ ...input, churchId })
  }

  /**
   * GET /departments - List departments by church.
   * `department_leader` callers are scoped to the department(s) they lead.
   */
  @Get()
  @RequirePermission('read:department')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    if (request.user['role'] === UserRole.DEPARTMENT_LEADER) {
      const userId = request.user['id'] as string
      const member = await this.membersService.getMemberByUserId(churchId, userId)
      const ledDepartmentIds = member
        ? await this.departmentsService.getLedDepartmentIds(churchId, member.id)
        : []

      return this.departmentsService.getDepartmentsByChurch(churchId, ledDepartmentIds)
    }

    return this.departmentsService.getDepartmentsByChurch(churchId)
  }

  /**
   * GET /departments/:id - Get single department
   */
  @Get(':id')
  @RequirePermission('read:department')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const department = await this.departmentsService.getDepartmentByIdInChurch(request['churchId'] as string, id)
    if (!department) {
      throw new BadRequestException(`Department with ID ${id} not found`)
    }
    return department
  }

  /**
   * PUT /departments/:id - Update department
   */
  @Put(':id')
  @RequirePermission('manage:departments')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() input: UpdateDepartmentInput,
  ) {
    return this.departmentsService.updateDepartment(request['churchId'] as string, id, input)
  }

  /**
   * DELETE /departments/:id - Soft delete department
   */
  @Delete(':id')
  @RequirePermission('manage:departments')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.departmentsService.deleteDepartment(request['churchId'] as string, id)
    return { message: 'Department deleted successfully' }
  }

  /**
   * GET /departments/:id/members - Get members in a department
   */
  @Get(':id/members')
  @RequirePermission('read:department')
  async getDepartmentMembers(@Req() request: Request, @Param('id') id: string) {
    return this.departmentsService.getDepartmentMembers(request['churchId'] as string, id)
  }

  /**
   * POST /departments/:id/members - Assign member to department
   */
  @Post(':id/members')
  @RequirePermission('manage:departments')
  async assignMember(
    @Req() request: Request,
    @Param('id') id: string,
    @Body('memberId') memberId: string,
    @Body('isLeader') isLeader: boolean = false,
  ) {
    if (!memberId) {
      throw new BadRequestException('memberId is required')
    }

    return this.departmentsService.assignMemberToDepartment(request['churchId'] as string, id, memberId, isLeader)
  }

  /**
   * DELETE /departments/:id/members/:memberId - Remove member from department
   */
  @Delete(':id/members/:memberId')
  @RequirePermission('manage:departments')
  async removeMember(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.departmentsService.removeMemberFromDepartment(request['churchId'] as string, id, memberId)
    return { message: 'Member removed from department' }
  }

  /**
   * POST /departments/:id/leaders - Add a leader to the department
   */
  @Post(':id/leaders')
  @RequirePermission('manage:departments')
  async addLeader(
    @Req() request: Request,
    @Param('id') id: string,
    @Body('memberId') memberId: string,
  ) {
    if (!memberId) {
      throw new BadRequestException('memberId is required')
    }

    return this.departmentsService.addLeader(request['churchId'] as string, id, memberId)
  }

  /**
   * DELETE /departments/:id/leaders/:memberId - Remove a leader from the department
   */
  @Delete(':id/leaders/:memberId')
  @RequirePermission('manage:departments')
  async removeLeader(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.departmentsService.removeLeader(request['churchId'] as string, id, memberId)
    return { message: 'Leader removed from department' }
  }

  /**
   * GET /departments/:id/stats - Get department statistics
   */
  @Get(':id/stats')
  @RequirePermission('read:department')
  async getStats(@Req() request: Request, @Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(request['churchId'] as string, id)
  }
}
