import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { AuthenticatedRequest } from '../auth/dto/auth-request.dto'
import { FileUploadService } from '../file-upload/file-upload.service'
import {
  LibraryResourceQueryDto,
  ResourceProgressDto,
  TransitionLibraryResourceDto,
  UpdateLibraryResourceDto,
} from '../file-upload/dtos/library-resource.dto'

@Controller('library/resources')
export class LibraryController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Get()
  @RequirePermission('read:self')
  list(@Req() request: AuthenticatedRequest, @Query() query: LibraryResourceQueryDto) {
    return this.fileUploadService.listLibraryResources(
      request.user.id,
      request.churchId || request.user.churchId,
      request.user.role,
      {
        limit: query.limit,
        cursor: query.cursor == null ? undefined : String(query.cursor),
        query: query.query,
        resourceType: query.resourceType,
        category: query.category,
        branchId: query.branchId,
      },
    )
  }

  @Get(':id')
  @RequirePermission('read:self')
  detail(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.fileUploadService.getLibraryResource(
      request.user.id,
      request.churchId || request.user.churchId,
      request.user.role,
      id,
    )
  }

  @Post(':id/access')
  @RequirePermission('read:self')
  access(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.fileUploadService.getLibraryResourceAccessUrl(
      request.user.id,
      request.churchId || request.user.churchId,
      request.user.role,
      id,
    )
  }

  @Patch(':id')
  @RequirePermission('manage:files')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateLibraryResourceDto,
  ) {
    return this.fileUploadService.updateLibraryResource(
      request.user.id,
      request.churchId || request.user.churchId,
      id,
      body,
    )
  }

  @Post(':id/status')
  @RequirePermission('manage:files')
  transition(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: TransitionLibraryResourceDto,
  ) {
    return this.fileUploadService.transitionLibraryResource(
      request.user.id,
      request.churchId || request.user.churchId,
      id,
      body.status,
    )
  }

  @Get(':id/progress')
  @RequirePermission('read:self')
  progress(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.fileUploadService.getResourceProgress(
      request.user.id,
      request.churchId || request.user.churchId,
      request.user.role,
      id,
    )
  }

  @Patch(':id/progress')
  @RequirePermission('read:self')
  updateProgress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ResourceProgressDto,
  ) {
    return this.fileUploadService.updateResourceProgress(
      request.user.id,
      request.churchId || request.user.churchId,
      request.user.role,
      id,
      body,
    )
  }
}
