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

    console.log('[ChurchContextGuard] User role:', user.role, 'User churchId:', user.churchId, 'Request path:', request.path)

    // Get churchId from:
    // 1. Request params (/churches/:churchId/members)
    // 2. Query string (?churchId=xxx)
    // 3. Request body (POST/PUT)
    // 4. User's assigned church (for regular users)
    const churchIdFromParams = request.params.churchId
    const churchIdFromQuery = request.query.churchId
    const churchIdFromBody = (request.body as any)?.churchId

    let requestedChurchId =
      churchIdFromParams || churchIdFromQuery || churchIdFromBody

    console.log('[ChurchContextGuard] Query params:', request.query, 'churchIdFromQuery:', churchIdFromQuery)

    // Super admin can view all churches
    if (user.role === UserRole.SUPER_ADMIN) {
      // For super admin, if no churchId specified in request, use their assigned church if available
      if (!requestedChurchId && user.churchId) {
        requestedChurchId = user.churchId
      }
      // Set the churchId on request for controllers to use
      if (requestedChurchId) {
        request['churchId'] = requestedChurchId
        console.log('[ChurchContextGuard] Super admin, set churchId:', requestedChurchId)
      }
      return true
    }

    // If no churchId in request, check if it's a safe endpoint
    if (!requestedChurchId) {
      // Allow profile endpoints and GET /churches without churchId (for new users)
      const safePaths = ['/profile', '/users/me']
      const safeEndpoints = {
        '/auth/setup': ['POST'],
        '/churches': ['GET'],
        '/auth/profile': ['GET'],
      }
      
      if (safePaths.some((path) => request.path.includes(path))) {
        return true
      }
      
      // Check if this is a safe endpoint
      for (const [path, methods] of Object.entries(safeEndpoints)) {
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
