"use client"

import { type ReactNode } from "react"
import { usePermission, useHasAnyPermission, useHasAllPermissions, usePermissionDenialReason } from "@/hooks/use-permissions"
import type { PermissionAction } from "@church/config"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PermissionGateProps {
  children: ReactNode
  permission?: PermissionAction
  permissions?: PermissionAction[]
  requireAll?: boolean
  fallback?: ReactNode
  showDisabled?: boolean
}

/**
 * Component that conditionally renders children based on user permissions
 * Can show disabled state with tooltip instead of completely hiding
 * 
 * @example
 * // Single permission check
 * <PermissionGate permission="update:visitor">
 *   <EditButton />
 * </PermissionGate>
 * 
 * @example
 * // Show disabled button with tooltip
 * <PermissionGate permission="update:visitor" showDisabled>
 *   <EditButton />
 * </PermissionGate>
 * 
 * @example
 * // Check any of multiple permissions
 * <PermissionGate permissions={['update:visitor', 'delete:visitor']}>
 *   <ManageButtons />
 * </PermissionGate>
 * 
 * @example
 * // With fallback
 * <PermissionGate permission="update:visitor" fallback={<ViewOnlyMessage />}>
 *   <EditButton />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showDisabled = false,
}: PermissionGateProps) {
  const hasSinglePermission = usePermission(permission!)
  const hasAnyOfPermissions = useHasAnyPermission(permissions || [])
  const hasAllOfPermissions = useHasAllPermissions(permissions || [])
  const denialReason = usePermissionDenialReason(permission!)

  // Single permission check
  if (permission && !permissions) {
    if (hasSinglePermission) {
      return <>{children}</>
    }
    
    if (showDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="opacity-50 cursor-not-allowed">
                {children}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-red-600">
              <p>{denialReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    
    return <>{fallback}</>
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasPermission = requireAll 
      ? hasAllOfPermissions
      : hasAnyOfPermissions

    if (hasPermission) {
      return <>{children}</>
    }

    if (showDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="opacity-50 cursor-not-allowed">
                {children}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-red-600">
              <p>You don't have permission to perform this action</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return <>{fallback}</>
  }

  // No permission specified, don't render
  return <>{fallback}</>
}
