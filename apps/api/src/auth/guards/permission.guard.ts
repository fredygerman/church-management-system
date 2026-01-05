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
  PERMISSION_MAP,
} from '../types/permission.types'

export const REQUIRED_PERMISSION_KEY = 'required_permission'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<PermissionAction>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler()
    )

    // If no permission is specified, allow
    if (!requiredPermission) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user as UserContext

    if (!user) {
      throw new ForbiddenException('User context not found')
    }

    // Get user's allowed permissions based on role
    const allowedPermissions = PERMISSION_MAP[user.role] || []

    // Check if user has the required permission
    const hasPermission = allowedPermissions.includes(requiredPermission)

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${requiredPermission}. Required role: ${requiredPermission}`
      )
    }

    return true
  }
}
