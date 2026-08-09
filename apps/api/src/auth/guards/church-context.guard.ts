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
import { and, eq, isNull } from 'drizzle-orm'
import { db, userChurchMemberships } from '@church/db'

@Injectable()
export class ChurchContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const churchIdFromParams = request.params.churchId as string | undefined
    const churchIdFromChurchRoute =
      request.path.startsWith('/churches/') ? (request.params.id as string | undefined) : undefined
    const churchIdFromQuery = request.query.churchId as string | undefined
    const churchIdFromBody = (request.body as any)?.churchId as string | undefined

    let requestedChurchId =
      churchIdFromParams || churchIdFromChurchRoute || churchIdFromQuery || churchIdFromBody

    // Non-super-admin users are church-bound. If no explicit churchId is provided,
    // consistently default to the church assigned on the authenticated user.
    if (!requestedChurchId && user.churchId) {
      requestedChurchId = user.churchId
    }

    // If still no churchId in request, check if it's a safe endpoint
    if (!requestedChurchId) {
      // Allow profile endpoints and GET /churches without churchId (for new users)
      const safePaths = ['/profile', '/users/me']
      const safeEndpoints = {
        '/auth/setup': ['POST'],
        '/auth/switch-church': ['POST'],
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

    const [membership] = await db
      .select()
      .from(userChurchMemberships)
      .where(
        and(
          eq(userChurchMemberships.userId, user.id),
          eq(userChurchMemberships.churchId, requestedChurchId),
          isNull(userChurchMemberships.deletedAt),
        )
      )
      .limit(1)

    if (membership?.status === 'suspended') {
      throw new ForbiddenException('Your membership in this church is suspended')
    }

    if (membership?.status === 'invited') {
      throw new ForbiddenException('Your membership invitation must be accepted before access')
    }

    if (membership?.status === 'active') {
      user.role = membership.role
      user.churchId = membership.churchId
      user.activeChurchId = membership.churchId
      user.activeMembershipId = membership.id
      user.assignedZoneId = membership.assignedZoneId ?? undefined
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You do not have access to this church. Access denied.'
      )
    } else {
      user.churchId = requestedChurchId
      user.activeChurchId = requestedChurchId
    }

    // Store churchId in request for use in controllers
    request['churchId'] = requestedChurchId
    if (request.body && typeof request.body === 'object') {
      request.body.churchId = requestedChurchId
    }

    return true
  }
}
