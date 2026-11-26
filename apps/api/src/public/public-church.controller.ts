import { Controller, Get, Param, Query } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { PublicChurchService } from './public-church.service'
import { PublicChurchQueryDto } from './public-church.dto'

@Controller('public/churches')
@Public()
export class PublicChurchController {
  constructor(private readonly service: PublicChurchService) {}

  @Get()
  list(@Query() query: PublicChurchQueryDto) {
    return this.service.listChurches({
      limit: query.limit,
      offset: query.offset,
      query: query.query,
    })
  }

  @Get(':publicId')
  detail(@Param('publicId') publicId: string) {
    return this.service.getChurch(publicId)
  }
}
