# Frontend Permission System

**Source of truth:** `packages/config/src/permissions.ts` (re-exported by `apps/web/lib/permissions.ts`). Adding a role or permission there is enough — this file's hooks/components read from it generically, no separate frontend registration needed.

## Overview

The frontend permission system mirrors the backend RBAC (Role-Based Access Control) system, providing client-side and server-side utilities for permission checking.

## Files Structure

```
apps/web/
  lib/
    permissions.ts           # Core permission logic
    permissions-server.ts    # Server-side utilities
  hooks/
    use-permissions.ts       # React hooks for client components
  components/
    auth/
      permission-gate.tsx    # Conditional rendering component
```

---

## Usage Examples

### 1. Client Components (Hooks)

```tsx
"use client"

import { usePermission, useIsAdmin } from "@/hooks/use-permissions"

export function VisitorActions({ visitorId }: { visitorId: string }) {
  const canEdit = usePermission('update:visitor')
  const canDelete = usePermission('delete:visitor')
  const isAdmin = useIsAdmin()

  return (
    <div>
      {canEdit && <EditButton visitorId={visitorId} />}
      {canDelete && <DeleteButton visitorId={visitorId} />}
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

### 2. Server Components

```tsx
import { checkPermission, checkIsAdmin } from "@/lib/permissions-server"

export default async function VisitorDetailPage({ params }) {
  const canEdit = await checkPermission('update:visitor')
  const isAdmin = await checkIsAdmin()

  return (
    <div>
      <h1>Visitor Details</h1>
      {canEdit && (
        <Link href={`/visitors/${params.id}/edit`}>
          <Button>Edit</Button>
        </Link>
      )}
    </div>
  )
}
```

### 3. Server Actions

```tsx
"use server"

import { requirePermission } from "@/lib/permissions-server"
import { revalidatePath } from "next/cache"

export async function deleteVisitor(visitorId: string) {
  // Throws error if user doesn't have permission
  await requirePermission('delete:visitor')
  
  // Proceed with deletion
  await db.delete(visitors).where(eq(visitors.id, visitorId))
  
  revalidatePath('/visitors')
}
```

### 4. Permission Gate Component

```tsx
import { PermissionGate } from "@/components/auth/permission-gate"

export function VisitorCard({ visitor }) {
  return (
    <Card>
      <CardContent>
        <h3>{visitor.name}</h3>
        
        {/* Show edit button only to users with update permission */}
        <PermissionGate permission="update:visitor">
          <EditButton />
        </PermissionGate>

        {/* Show admin panel to users with ANY of these permissions */}
        <PermissionGate permissions={['update:visitor', 'delete:visitor']}>
          <AdminActions />
        </PermissionGate>

        {/* Require ALL permissions */}
        <PermissionGate 
          permissions={['create:visitor', 'update:visitor', 'delete:visitor']} 
          requireAll
        >
          <FullAccessPanel />
        </PermissionGate>

        {/* With fallback */}
        <PermissionGate 
          permission="update:visitor" 
          fallback={<ViewOnlyMessage />}
        >
          <EditForm />
        </PermissionGate>
      </CardContent>
    </Card>
  )
}
```

---

## Available Hooks

### `usePermission(permission)`
Check if user has a specific permission.

```tsx
const canEdit = usePermission('update:visitor')
```

### `useHasAnyPermission(permissions)`
Check if user has ANY of the specified permissions.

```tsx
const canManage = useHasAnyPermission(['update:visitor', 'delete:visitor'])
```

### `useHasAllPermissions(permissions)`
Check if user has ALL of the specified permissions.

```tsx
const canFullyManage = useHasAllPermissions(['create:visitor', 'update:visitor'])
```

### `useUserPermissions()`
Get all permissions for current user.

```tsx
const permissions = useUserPermissions()
console.log('User permissions:', permissions)
```

### `useIsAdmin()`
Check if user is admin level (super_admin, admin, or branch_admin).

```tsx
const isAdminUser = useIsAdmin()
```

### `useIsSuperAdmin()`
Check if user is super admin.

```tsx
const isSuperAdmin = useIsSuperAdmin()
```

### `useUserRole()`
Get current user's role.

```tsx
const role = useUserRole()
```

---

## Server-Side Functions

### `checkPermission(permission)`
Check permission in server component/action.

```tsx
const canEdit = await checkPermission('update:visitor')
```

### `requirePermission(permission)`
Require permission or throw error.

```tsx
await requirePermission('update:visitor') // Throws if no permission
```

### `checkAnyPermission(permissions)`
Check if user has any of the permissions.

```tsx
const canManage = await checkAnyPermission(['update:visitor', 'delete:visitor'])
```

### `checkAllPermissions(permissions)`
Check if user has all permissions.

```tsx
const hasAll = await checkAllPermissions(['create:visitor', 'update:visitor'])
```

### `checkIsAdmin()`
Check if user is admin level.

```tsx
const isAdmin = await checkIsAdmin()
```

### `checkIsSuperAdmin()`
Check if user is super admin.

```tsx
const isSuperAdmin = await checkIsSuperAdmin()
```

### `getUserRole()`
Get current user's role.

```tsx
const role = await getUserRole()
```

---

## Available Permissions

Headline ones (the complete, current list — including attendance, communications, data-quality, family-lifecycle, and prayer-request permissions — is the `PermissionAction` type in `packages/config/src/permissions.ts`):

```typescript
'create:member'      // Create new member
'read:member'        // View member(s)
'update:member'      // Edit member
'delete:member'      // Delete member
'manage:zones'       // Create/edit zones
'manage:families'    // Create/edit families
'view:families'      // Read family data
'view:visitors'      // See visitor tracking
'create:visitor'     // Add new visitor
'update:visitor'     // Edit visitor followup
'manage:departments' // Full department/ministry management (admins only)
'read:department'    // View a department's details/members/stats (department_leader + admins)
'manage:offerings'    // Full offering/giving management (admins only)
'view:giving-reports' // View aggregate giving reports by category/period (admins only)
'manage:giving-goals'  // Create/edit/delete fundraising goals (admins only)
'view:giving-goals'    // View public goal progress and opt-in donor names (all roles)
'manage:events'        // Create/edit/cancel events, manage RSVPs/attendance (admins only)
'manage:network-events' // Publish an event visible across all branches (super_admin/admin only)
'view:events'          // View the church event calendar (all roles)
'rsvp:event'           // Self-service RSVP to events (all roles)
'create:visitation'  // Log pastoral visits
'read:visitation'    // View visitation logs
```

---

## Role Hierarchy

| Role | Level | Permissions |
|------|-------|-------------|
| super_admin | Highest | All permissions |
| admin | High | All except delete:member restrictions branch_admin has |
| branch_admin | Medium | Church-level management, no hard delete |
| zone_leader | Low | Own zone: read-only member/visitor/visitation access |
| department_leader | Low | Own led department(s): read-only, mirrors zone_leader |
| member | Lowest | Own profile + self-service (attendance, prayer requests) only |

---

## Best Practices

### ✅ DO

1. **Always check permissions before rendering UI**
   ```tsx
   {canEdit && <EditButton />}
   ```

2. **Use PermissionGate for complex conditions**
   ```tsx
   <PermissionGate permission="update:visitor">
     <EditForm />
   </PermissionGate>
   ```

3. **Validate permissions in server actions**
   ```tsx
   await requirePermission('delete:visitor')
   ```

4. **Show meaningful fallbacks**
   ```tsx
   <PermissionGate permission="update:visitor" fallback={<ViewOnly />}>
     <EditForm />
   </PermissionGate>
   ```

### ❌ DON'T

1. **Don't rely only on client-side checks**
   ```tsx
   // ❌ Not secure - client can bypass
   if (canDelete) {
     await deleteVisitor(id)
   }
   
   // ✅ Always validate on server
   await requirePermission('delete:visitor')
   await deleteVisitor(id)
   ```

2. **Don't hardcode roles**
   ```tsx
   // ❌ Bad
   if (role === 'super_admin') { ... }
   
   // ✅ Good
   if (usePermission('update:visitor')) { ... }
   ```

3. **Don't forget error handling**
   ```tsx
   // ❌ Bad
   await requirePermission('delete:visitor')
   
   // ✅ Good
   try {
     await requirePermission('delete:visitor')
     // Proceed
   } catch (error) {
     toast.error("You don't have permission")
   }
   ```

---

## Sync with Backend

There is only **one** definition to maintain: `packages/config/src/permissions.ts` (`@church/config`). Both `apps/api/src/auth/types/permission.types.ts` and `apps/web/lib/permissions.ts` re-export from it — neither file declares its own `PermissionAction` type or `PERMISSION_MAP`, so there is no separate frontend copy to keep in sync.

When adding a new permission or role:
1. Add the `PermissionAction` string (and/or `UserRole` value) in `packages/config/src/permissions.ts`
2. Add it to the relevant `PERMISSION_MAP` entries and add a `PERMISSION_METADATA` entry
3. If the role needs single-resource scoping (only their zone/department/etc.), add a guard in `apps/api/src/auth/guards/` and register it in `app.module.ts`
4. Update this documentation if the change is significant enough to warrant it

---

## Testing

```tsx
// Mock session in tests
import { useSession } from "next-auth/react"

jest.mock("next-auth/react")

describe("VisitorActions", () => {
  it("shows edit button for users with update permission", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { role: "branch_admin" } }
    })
    
    render(<VisitorActions />)
    expect(screen.getByText("Edit")).toBeInTheDocument()
  })
})
```

---

## Summary

The permission system provides:
- ✅ Type-safe permission checking
- ✅ Client-side hooks for React components
- ✅ Server-side utilities for SSR
- ✅ Declarative PermissionGate component
- ✅ Complete parity with backend RBAC
- ✅ Easy to test and maintain
