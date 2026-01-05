import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Request } from 'express'
import { UserContext, UserRole } from '../types/permission.types'

@Injectable()
export class ChurchContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext

    if (!user) {
      throw new ForbiddenException('User context not found')
    }

    // Super admin can view all churches
    if (user.role === UserRole.SUPER_ADMIN) {
      return true
    }

    // Get churchId from:
    // 1. Request params (/churches/:churchId/members)
    // 2. Query string (?churchId=xxx)
    // 3. Request body (POST/PUT)
    const churchIdFromParams = request.params.churchId
    const churchIdFromQuery = request.query.churchId
    const churchIdFromBody = (request.body as any)?.churchId

    const requestedChurchId =
      churchIdFromParams || churchIdFromQuery || churchIdFromBody

    // If no churchId in request, check if it's a safe endpoint
    if (!requestedChurchId) {
      // Allow profile endpoints without churchId
      const safePaths = ['/profile', '/users/me']
      if (safePaths.some((path) => request.path.includes(path))) {
        return true
      }
      throw new ForbiddenException(
        'Church context (churchId) is required for this operation'
      )
    }

    // Verify user belongs to requested church
    if (user.churchId !== requestedChurchId) {
      throw new ForbiddenException(
        'You do not have access to this church. Access denied.'
      )
    }

    // Store churchId in request for use in controllers
    request['churchId'] = requestedChurchId

    return true
  }
}
