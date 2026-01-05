import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { UserContext, UserRole } from '../types/permission.types'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class ChurchContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

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
      // Allow profile endpoints and GET /churches without churchId (for new users)
      const safePaths = ['/profile', '/users/me']
      const safeGetPaths = {
        '/churches': ['GET'],
        '/auth/profile': ['GET'],
      }
      
      if (safePaths.some((path) => request.path.includes(path))) {
        return true
      }
      
      // Check if this is a safe GET endpoint
      for (const [path, methods] of Object.entries(safeGetPaths)) {
        if (request.path.includes(path) && methods.includes(request.method)) {
          return true
        }
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
