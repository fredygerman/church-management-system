import { Controller, Get, Patch, Param, Query, Req } from '@nestjs/common'
import { RequirePermission } from '../auth/decorators/require-permission.decorator'
import { AuthenticatedRequest } from '../auth/dto/auth-request.dto'
import { NotificationsService } from './notifications.service'
import { NotificationListQueryDto } from './notifications.dto'

@Controller('notifications')
@RequirePermission('read:self')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: NotificationListQueryDto,
  ) {
    return this.service.list(request.user.id, {
      limit: query.limit,
      cursor: query.cursor == null ? undefined : String(query.cursor),
      unreadOnly: query.unread === true,
    })
  }

  @Patch('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.service.markAllRead(request.user.id)
  }

  @Patch(':id/read')
  markRead(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.markRead(request.user.id, id)
  }
}
