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
import {
  GivingGoalsService,
  type CreateGivingGoalInput,
  type UpdateGivingGoalInput,
} from './giving-goals.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

/**
 * Shared create/update validation, matching how OfferingsController validates
 * amountCents inline. `isUpdate` makes required-field checks conditional -
 * PUT only validates fields that are actually present in the body.
 */
function validateGoalInput(input: Partial<CreateGivingGoalInput>, isUpdate: boolean) {
  if ((!isUpdate || input.name !== undefined) && !input.name?.trim()) {
    throw new BadRequestException('name is required')
  }
  if (!isUpdate || input.targetCents !== undefined) {
    if (!Number.isInteger(input.targetCents) || (input.targetCents as number) <= 0) {
      throw new BadRequestException('targetCents must be a positive integer')
    }
  }
  if (!isUpdate || input.currency !== undefined) {
    if (!input.currency || input.currency.length !== 3) {
      throw new BadRequestException('currency must be a 3-character code')
    }
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    throw new BadRequestException('endDate must not be before startDate')
  }
}

@Controller('giving-goals')
@UseGuards(ChurchContextGuard)
export class GivingGoalsController {
  constructor(private readonly givingGoalsService: GivingGoalsService) {}

  /**
   * POST /giving-goals - Create a new giving goal
   */
  @Post()
  @RequirePermission('manage:giving-goals')
  async create(@Req() request: Request, @Body() input: CreateGivingGoalInput) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    validateGoalInput(input, false)
    return this.givingGoalsService.createGoal({ ...input, churchId })
  }

  /**
   * GET /giving-goals - Staff list, church-scoped, includes private goals
   */
  @Get()
  @RequirePermission('manage:giving-goals')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    return this.givingGoalsService.getGoalsByChurch(churchId)
  }

  /**
   * GET /giving-goals/public - Member-facing list, isPublic goals only.
   * CRITICAL: never returns private goals or individual offering amounts.
   */
  @Get('public')
  @RequirePermission('view:giving-goals')
  async listPublic(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    return this.givingGoalsService.getPublicGoalsByChurch(churchId)
  }

  /**
   * GET /giving-goals/:id - Staff detail + progress
   */
  @Get(':id')
  @RequirePermission('manage:giving-goals')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const goal = await this.givingGoalsService.getGoalWithProgress(request['churchId'] as string, id)
    if (!goal) {
      throw new BadRequestException(`Giving goal with ID ${id} not found`)
    }
    return goal
  }

  /**
   * PUT /giving-goals/:id - Update a giving goal
   */
  @Put(':id')
  @RequirePermission('manage:giving-goals')
  async update(@Req() request: Request, @Param('id') id: string, @Body() input: UpdateGivingGoalInput) {
    validateGoalInput(input, true)
    return this.givingGoalsService.updateGoal(request['churchId'] as string, id, input)
  }

  /**
   * DELETE /giving-goals/:id - Soft delete a giving goal
   */
  @Delete(':id')
  @RequirePermission('manage:giving-goals')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.givingGoalsService.deleteGoal(request['churchId'] as string, id)
    return { message: 'Giving goal deleted successfully' }
  }

  /**
   * GET /giving-goals/:id/offerings - Individual offering rows linked to this
   * goal, for staff reconciliation. Gated on manage:offerings, deliberately
   * NOT manage:giving-goals or view:giving-goals - this is the one goals
   * route that exposes raw, unfiltered contribution amounts, so it must never
   * be reachable by a caller who can only see the public progress bar.
   */
  @Get(':id/offerings')
  @RequirePermission('manage:offerings')
  async getOfferings(@Req() request: Request, @Param('id') id: string) {
    return this.givingGoalsService.getOfferingsForGoal(request['churchId'] as string, id)
  }
}
