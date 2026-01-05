import { SetMetadata } from '@nestjs/common'
import { PermissionAction } from '../types/permission.types'
import { REQUIRED_PERMISSION_KEY } from '../guards/permission.guard'

export const RequirePermission = (permission: PermissionAction) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission)
