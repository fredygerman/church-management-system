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
import { FamiliesService, type CreateFamilyInput } from './families.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

export type UpdateFamilyInput = Partial<CreateFamilyInput>

@Controller('families')
@UseGuards(ChurchContextGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  /**
   * POST /families - Create new family
   */
  @Post()
  @RequirePermission('manage:families')
  async create(@Body() input: CreateFamilyInput) {
    if (!input.churchId || !input.familyName) {
      throw new BadRequestException('Missing required fields: churchId, familyName')
    }

    return this.familiesService.createFamily(input)
  }

  /**
   * GET /families - List families by church
   */
  @Get()
  @RequirePermission('view:families')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }

    return this.familiesService.getFamiliesByChurch(churchId)
  }

  /**
   * GET /families/:id - Get single family
   */
  @Get(':id')
  @RequirePermission('view:families')
  async getOne(@Param('id') id: string) {
    const family = await this.familiesService.getFamilyById(id)
    if (!family) {
      throw new BadRequestException(`Family with ID ${id} not found`)
    }
    return family
  }

  /**
   * PUT /families/:id - Update family
   */
  @Put(':id')
  @RequirePermission('manage:families')
  async update(
    @Param('id') id: string,
    @Body() input: UpdateFamilyInput,
  ) {
    return this.familiesService.updateFamily(id, input)
  }

  /**
   * DELETE /families/:id - Soft delete family
   */
  @Delete(':id')
  @RequirePermission('manage:families')
  async delete(@Param('id') id: string) {
    await this.familiesService.deleteFamily(id)
    return { message: 'Family deleted successfully' }
  }
}
