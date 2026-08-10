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
import {
  OfferingsService,
  type CreateOfferingCategoryInput,
  type CreateOfferingInput,
} from './offerings.service'
import { MembersService } from '../members/members.service'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'

export type UpdateOfferingCategoryInput = Partial<CreateOfferingCategoryInput>
export type UpdateOfferingInput = Partial<CreateOfferingInput>

@Controller('offering-categories')
@UseGuards(ChurchContextGuard)
export class OfferingCategoriesController {
  constructor(private readonly offeringsService: OfferingsService) {}

  /**
   * POST /offering-categories - Create a new offering category
   */
  @Post()
  @RequirePermission('manage:offerings')
  async create(@Req() request: Request, @Body() input: CreateOfferingCategoryInput) {
    const churchId = request['churchId'] as string
    if (!churchId || !input?.name?.trim()) {
      throw new BadRequestException('Missing required fields: churchId, name')
    }

    return this.offeringsService.createCategory({ ...input, churchId })
  }

  /**
   * GET /offering-categories - List offering categories by church
   */
  @Get()
  @RequirePermission('manage:offerings')
  async list(@Req() request: Request) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    return this.offeringsService.getCategoriesByChurch(churchId)
  }

  /**
   * PUT /offering-categories/:id - Update an offering category
   */
  @Put(':id')
  @RequirePermission('manage:offerings')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() input: UpdateOfferingCategoryInput,
  ) {
    return this.offeringsService.updateCategory(request['churchId'] as string, id, input)
  }

  /**
   * DELETE /offering-categories/:id - Soft delete an offering category
   */
  @Delete(':id')
  @RequirePermission('manage:offerings')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.offeringsService.deleteCategory(request['churchId'] as string, id)
    return { message: 'Offering category deleted successfully' }
  }
}

@Controller('offerings')
@UseGuards(ChurchContextGuard)
export class OfferingsController {
  constructor(
    private readonly offeringsService: OfferingsService,
    private readonly membersService: MembersService,
  ) {}

  /**
   * GET /offerings/me - List the caller's own named offerings (self-service).
   * Anonymous rows (memberId = null) and other members' rows are excluded by
   * construction of the equality filter in the service.
   */
  @Get('me')
  @RequirePermission('read:own-giving-history')
  async getMine(@Req() request: Request) {
    const churchId = request['churchId'] as string
    const userId = request.user['id'] as string
    const member = await this.membersService.getMemberByUserId(churchId, userId)
    if (!member) return []
    return this.offeringsService.getMyOfferings(churchId, member.id)
  }

  /**
   * GET /offerings/reports/summary - Aggregate giving totals, grouped by
   * category or period AND currency (never blended across currencies).
   */
  @Get('reports/summary')
  @RequirePermission('view:giving-reports')
  async summary(
    @Req() request: Request,
    @Query('groupBy') groupBy: 'category' | 'period',
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const churchId = request['churchId'] as string
    if (groupBy !== 'category' && groupBy !== 'period') {
      throw new BadRequestException('groupBy must be "category" or "period"')
    }
    if (groupBy === 'period' && period && !['week', 'month', 'year'].includes(period)) {
      throw new BadRequestException('period must be "week", "month" or "year"')
    }

    return this.offeringsService.getSummaryReport(churchId, { groupBy, period, from, to })
  }

  /**
   * POST /offerings - Record a new offering
   */
  @Post()
  @RequirePermission('manage:offerings')
  async create(@Req() request: Request, @Body() input: CreateOfferingInput) {
    const churchId = request['churchId'] as string
    if (!churchId || !input?.categoryId || input?.amountCents == null || !input?.currency || !input?.offeringDate) {
      throw new BadRequestException(
        'Missing required fields: categoryId, amountCents, currency, offeringDate',
      )
    }
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer')
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new BadRequestException('currency must be a 3-character uppercase code (e.g., USD)')
    }

    return this.offeringsService.createOffering({ ...input, churchId })
  }

  /**
   * GET /offerings - List offerings by church, filterable by categoryId,
   * memberId, sessionId and offeringDate range (from/to)
   */
  @Get()
  @RequirePermission('manage:offerings')
  async list(
    @Req() request: Request,
    @Query('categoryId') categoryId?: string,
    @Query('memberId') memberId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('goalId') goalId?: string,
  ) {
    const churchId = request['churchId'] as string
    if (!churchId) {
      throw new BadRequestException('Church context is required')
    }
    return this.offeringsService.getOfferingsByChurch(churchId, {
      categoryId,
      memberId,
      sessionId,
      from,
      to,
      goalId,
    })
  }

  /**
   * GET /offerings/:id - Get a single offering
   */
  @Get(':id')
  @RequirePermission('manage:offerings')
  async getOne(@Req() request: Request, @Param('id') id: string) {
    const offering = await this.offeringsService.getOfferingByIdInChurch(request['churchId'] as string, id)
    if (!offering) {
      throw new BadRequestException(`Offering with ID ${id} not found`)
    }
    return offering
  }

  /**
   * PUT /offerings/:id - Update an offering
   */
  @Put(':id')
  @RequirePermission('manage:offerings')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() input: UpdateOfferingInput,
  ) {
    if (input?.amountCents != null && (!Number.isInteger(input.amountCents) || input.amountCents <= 0)) {
      throw new BadRequestException('amountCents must be a positive integer')
    }
    if (input?.currency != null && !/^[A-Z]{3}$/.test(input.currency)) {
      throw new BadRequestException('currency must be a 3-character uppercase code (e.g., USD)')
    }
    return this.offeringsService.updateOffering(request['churchId'] as string, id, input)
  }

  /**
   * DELETE /offerings/:id - Soft delete an offering
   */
  @Delete(':id')
  @RequirePermission('manage:offerings')
  async delete(@Req() request: Request, @Param('id') id: string) {
    await this.offeringsService.deleteOffering(request['churchId'] as string, id)
    return { message: 'Offering deleted successfully' }
  }
}
