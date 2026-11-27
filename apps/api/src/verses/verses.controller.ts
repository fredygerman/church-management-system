import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { ChurchContextGuard } from '../auth/guards/church-context.guard'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { parseVerseLocale } from './verse-validation'
import { VersesService } from './verses.service'

/**
 * Verse of the day. GET /verses/today is open to any signed-in member of the church;
 * everything else needs view:verses (read) or manage:verses (change).
 */
@Controller('verses')
@UseGuards(ChurchContextGuard)
export class VersesController {
  constructor(private readonly versesService: VersesService) {}

  @Get('today')
  async getToday(@Req() request: Request, @Query('locale') locale?: string) {
    return this.versesService.getTodayVerse(churchIdOf(request), parseVerseLocale(locale))
  }

  @Get('entries')
  @RequirePermission('view:verses')
  async listEntries(@Req() request: Request) {
    return this.versesService.listEntries(churchIdOf(request))
  }

  @Post('entries')
  @RequirePermission('manage:verses')
  async createEntry(@Req() request: Request, @Body() body: unknown) {
    return this.versesService.createEntry(churchIdOf(request), userIdOf(request), body)
  }

  @Patch('entries/:id')
  @RequirePermission('manage:verses')
  async updateEntry(@Req() request: Request, @Param('id') entryId: string, @Body() body: unknown) {
    return this.versesService.updateEntry(churchIdOf(request), entryId, body)
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage:verses')
  async deleteEntry(@Req() request: Request, @Param('id') entryId: string) {
    await this.versesService.deleteEntry(churchIdOf(request), entryId)
  }

  @Get('overrides')
  @RequirePermission('view:verses')
  async listOverrides(@Req() request: Request, @Query('from') from?: string, @Query('to') to?: string) {
    return this.versesService.listOverrides(churchIdOf(request), from, to)
  }

  @Put('overrides/:date')
  @RequirePermission('manage:verses')
  async setOverride(@Req() request: Request, @Param('date') date: string, @Body() body: unknown) {
    return this.versesService.setOverride(churchIdOf(request), userIdOf(request), date, body)
  }

  @Delete('overrides/:date')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage:verses')
  async clearOverride(@Req() request: Request, @Param('date') date: string) {
    await this.versesService.clearOverride(churchIdOf(request), date)
  }
}

function churchIdOf(request: Request): string {
  return request['churchId'] as string
}

function userIdOf(request: Request): string | null {
  const id = (request.user as Record<string, unknown> | undefined)?.['id']
  return typeof id === 'string' ? id : null
}
