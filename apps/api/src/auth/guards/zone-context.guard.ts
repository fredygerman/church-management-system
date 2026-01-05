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
export class ZoneContextGuard implements CanActivate {
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

    // Only enforce zone context for zone leaders
    if (user.role !== UserRole.ZONE_LEADER) {
      return true
    }

    // Zone leader must have assignedZoneId
    if (!user.assignedZoneId) {
      throw new ForbiddenException(
        'Zone leader must have an assigned zone'
      )
    }

    // Get zoneId from:
    // 1. Request params (/zones/:zoneId/members)
    // 2. Query string (?zoneId=xxx)
    // 3. Request body (POST/PUT)
    const zoneIdFromParams = request.params.zoneId
    const zoneIdFromQuery = request.query.zoneId
    const zoneIdFromBody = (request.body as any)?.zoneId

    const requestedZoneId =
      zoneIdFromParams || zoneIdFromQuery || zoneIdFromBody

    // If no zoneId specified, use leader's assigned zone (default)
    if (!requestedZoneId) {
      // Inject the user's zone into the request
      if (request.params) {
        request.params.zoneId = user.assignedZoneId
      }
      if (!request.query) {
        request.query = {}
      }
      request.query.zoneId = user.assignedZoneId
      return true
    }

    // Verify leader is accessing only their assigned zone
    if (user.assignedZoneId !== requestedZoneId) {
      throw new ForbiddenException(
        'You can only access members from your assigned zone'
      )
    }

    return true
  }
}
