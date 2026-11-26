import { UserRole } from './types/permission.types'

type PlatformAdminIdentity = {
  id?: string | null
}

function configuredValues(name: string): Set<string> {
  return new Set(
    (process.env[name] ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

/**
 * Platform authority is deliberately sourced from server-only configuration.
 * A JWT role or a church membership can never make a caller a platform admin.
 */
export function isPlatformAdmin(identity: PlatformAdminIdentity | null | undefined): boolean {
  if (!identity) return false

  const ids = configuredValues('PLATFORM_ADMIN_USER_IDS')
  return Boolean(identity.id && ids.has(identity.id.toLowerCase()))
}

export function effectiveRole(
  identity: PlatformAdminIdentity & { role?: string | null },
  role: string | null | undefined,
): string | null | undefined {
  return isPlatformAdmin(identity) ? UserRole.SUPER_ADMIN : role
}
