import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common'
import { ChurchService } from './churches.service'
import { GetUser } from '@/auth/decorators'
import { churches } from '@church/db'
import { UserContext } from '@/auth/types/permission.types'

export type CreateChurchInput = {
  churchId?: string
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}

export type UpdateChurchInput = {
  name?: string
  location?: string
  leadPastorName?: string
  phone?: string
  email?: string
  description?: string
}

@Controller('churches')
export class ChurchController {
  constructor(private readonly churchService: ChurchService) {}

  /**
   * POST /churches - Create new church/branch
   * The creator becomes the super_admin for this church
   */
  @Post()
  async create(
    @Body() input: CreateChurchInput,
    @GetUser() user: UserContext,
  ) {
    if (!input.name || !input.location || !input.leadPastorName) {
      throw new BadRequestException('Missing required fields: name, location, leadPastorName')
    }

    if (!user?.id) {
      throw new BadRequestException('User context required to create church')
    }

    return this.churchService.createChurch(
      {
        name: input.name,
        location: input.location,
        leadPastorName: input.leadPastorName,
        phone: input.phone,
        email: input.email,
        description: input.description,
      },
      user.id, // Pass the current user ID to be assigned as super_admin
    )
  }

  /**
   * GET /churches - List all churches for current user
   */
  @Get()
  async list() {
    return this.churchService.getChurches()
  }

  /**
   * GET /churches/:id - Get single church
   */
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const church = await this.churchService.getChurchById(id)
    if (!church) {
      throw new BadRequestException(`Church with ID ${id} not found`)
    }
    return church
  }

  /**
   * PUT /churches/:id - Update church
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() input: UpdateChurchInput,
  ) {
    return this.churchService.updateChurch(id, input)
  }

  /**
   * DELETE /churches/:id - Soft delete church
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.churchService.deleteChurch(id)
    return { message: 'Church deleted successfully' }
  }

}
