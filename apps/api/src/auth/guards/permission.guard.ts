import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import {
  UserContext,
  PermissionAction,
  roleHasPermission,
  getPermissionDenialReason,
} from '../types/permission.types'

export const REQUIRED_PERMISSION_KEY = 'required_permission'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionAction[]>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    )

    // If no permission is specified, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext

    if (!user) {
      throw new ForbiddenException('User context not found')
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      roleHasPermission(user.role as any, permission)
    )

    if (!hasPermission) {
      const userRole = user.role as any
      const denialMessages = requiredPermissions.map((permission) =>
        getPermissionDenialReason(permission, userRole)
      )
      throw new ForbiddenException(
        `Forbidden for role '${user.role}'. ${denialMessages.join(' OR ')}`
      )
    }

    return true
  }
}
