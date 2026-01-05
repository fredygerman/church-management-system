import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Request } from 'express'
import { UserContext, UserRole } from '../types/permission.types'

@Injectable()
export class ZoneContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext

    if (!user) {
      throw new ForbiddenException('User context not found')
    }

    // Only enforce zone context for jumuiya leaders
    if (user.role !== UserRole.JUMUIYA_LEADER) {
      return true
    }

    // Jumuiya leader must have assignedZoneId
    if (!user.assignedZoneId) {
      throw new ForbiddenException(
        'Jumuiya leader must have an assigned zone'
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
