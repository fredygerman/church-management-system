# Role Hierarchy & Permissions

**Source of truth:** `packages/config/src/permissions.ts` (`UserRole`, `PERMISSION_MAP`). This doc summarizes the headline permissions per role for quick reference — if it ever disagrees with that file, the file wins.

## Role Levels (Highest to Lowest)

### 1. **SUPER_ADMIN** (HQ Management)
- Full system access
- Can manage all churches, branches, users
- Can create/delete any records across all branches
- **Permission Level**: 100% access

**Permissions:**
- ✅ create:member
- ✅ read:member
- ✅ update:member
- ✅ delete:member
- ✅ manage:zones
- ✅ manage:families
- ✅ view:families
- ✅ view:visitors
- ✅ create:visitor
- ✅ update:visitor
- ✅ manage:departments
- ✅ manage:offerings / view:giving-reports
- ✅ create:visitation
- ✅ read:visitation

---

### 2. **ADMIN** (IT Administrators)
- System administration and maintenance
- Can manage users, roles, and settings
- **Use Case**: IT/Technical staff who maintain the system
- **Difference from BRANCH_ADMIN**: Can DELETE members and manage all operations
- **Cannot**: Restrict to specific churches/zones (global access like SUPER_ADMIN within operational scope)

**Permissions:**
- ✅ create:member
- ✅ read:member
- ✅ update:member
- ✅ delete:member (unlike BRANCH_ADMIN)
- ✅ manage:zones
- ✅ manage:families
- ✅ view:families
- ✅ view:visitors
- ✅ create:visitor
- ✅ update:visitor
- ✅ manage:departments
- ✅ manage:offerings / view:giving-reports
- ✅ create:visitation
- ✅ read:visitation

---

### 3. **BRANCH_ADMIN** (Local Branch Leadership)
- Manage operations at a specific church/branch
- Cannot delete members (soft operations only)
- Limited to their assigned church
- **Use Case**: Branch pastors, branch coordinators

**Permissions:**
- ✅ create:member
- ✅ read:member
- ✅ update:member
- ❌ delete:member (cannot hard delete)
- ✅ manage:zones
- ✅ view:families
- ✅ view:visitors
- ✅ create:visitor
- ✅ update:visitor
- ✅ manage:departments
- ✅ manage:offerings / view:giving-reports
- ✅ create:visitation
- ✅ read:visitation

---

### 4. **ZONE_LEADER** (Cell Group Leadership)
- Manage their assigned zone only
- Cannot create/edit members
- Read and track visitations
- **Use Case**: Zone coordinators, zone leaders

**Permissions:**
- ❌ create:member
- ✅ read:member
- ❌ update:member
- ❌ delete:member
- ❌ manage:zones (read-only: `read:zone`)
- ✅ view:families
- ✅ view:visitors / create:visitor / read:visitor
- ❌ update:visitor
- ❌ manage:departments / read:department
- ❌ manage:offerings / view:giving-reports
- ✅ create:visitation
- ✅ read:visitation
- ✅ view:attendance, view:communications, view:data-quality, view:lifecycle-dashboard
- ✅ read:self, update:self, create:prayer-request, read:own-prayer-requests

---

### 5. **DEPARTMENT_LEADER** (Ministry/Department Leadership)
- Manage their led department(s) only — resolved live from `member_departments.isLeader`, not a stored field
- A member can lead more than one department; a department can have more than one leader
- Otherwise mirrors ZONE_LEADER's baseline exactly (verbatim copy of its permission array with `read:zone` swapped for `read:department`)
- **Use Case**: Choir director, ushers coordinator, intercessors leader

**Permissions:** identical to ZONE_LEADER above, except `read:department` (not `read:zone`), and no `manage:departments` (read-only, same as ZONE_LEADER has no `manage:zones`).

**Scoping guard:** `DepartmentContextGuard` (`apps/api/src/auth/guards/department-context.guard.ts`) — queries `member_departments` live per request instead of reading a JWT-baked field, avoiding the drift `ZONE_LEADER`'s `assignedZoneId` can have against `member_zones.isLeader`.

---

### 6. **MEMBER** (Regular Members)
- View own profile only
- Cannot perform administrative tasks

**Permissions:**
- ❌ create:member
- ✅ read:member (own profile)
- ❌ update:member
- ❌ delete:member
- ❌ manage:zones / manage:departments
- ❌ manage:offerings / view:giving-reports
- ❌ view:families
- ✅ view:visitors / create:visitor
- ❌ update:visitor
- ❌ create:visitation / read:visitation
- ✅ view:attendance, view:communications, view:lifecycle-dashboard
- ✅ read:self, update:self, create:prayer-request, read:own-prayer-requests, read:own-giving-history

---

## Quick Comparison Table

| Permission | SUPER_ADMIN | ADMIN | BRANCH_ADMIN | ZONE_LEADER | DEPARTMENT_LEADER | MEMBER |
|-----------|:-----------:|:-----:|:------------:|:-----------:|:------------------:|:------:|
| Create Member | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read Member | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update Member | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Member | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Zones | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Families | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Visitors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Visitor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Departments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read Department | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Offerings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Giving Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Visitation | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

This table covers the headline permissions only. `packages/config/src/permissions.ts` also has attendance, communications, data-quality, family-lifecycle, and prayer-request permissions granted per role — see that file for the complete, current list.

---

## Access Scope

| Role | Scope | Context |
|------|-------|---------|
| SUPER_ADMIN | All churches | None - global |
| ADMIN | All churches | None - global (IT focus) |
| BRANCH_ADMIN | Single church | churchId (required) |
| ZONE_LEADER | Single zone | assignedZoneId (JWT-baked, set at login) |
| DEPARTMENT_LEADER | Led department(s) | resolved live per request via `member_departments` (no stored field) |
| MEMBER | Self only | userId |

---

## Implementation Notes

### Database Columns
```typescript
// Users table
role: roleEnum('role').default('member')
churchId: uuid('church_id')           // For BRANCH_ADMIN context
assignedZoneId: uuid('assigned_zone_id') // For ZONE_LEADER context
```

### NestJS Guards

Registered globally, in this order (`apps/api/src/app.module.ts`):

```typescript
JwtAuthGuard         // Authenticate
ChurchContextGuard    // Enforce churchId isolation
PermissionGuard       // Check @RequirePermission() against the caller's role
ZoneContextGuard       // Scope zone_leader to their assigned zone (JWT-baked)
DepartmentContextGuard // Scope department_leader to their led department(s) (live query)
```

### Example: Creating a Member
```typescript
// SUPER_ADMIN: Can create in any church
POST /api/members { churchId: "xyz", firstName: "John", ... }

// ADMIN: Can create in any church
POST /api/members { churchId: "xyz", firstName: "John", ... }

// BRANCH_ADMIN: Can only create in their church
POST /api/members { churchId: "<their-church>", firstName: "John", ... }
// If churchId doesn't match their context, gets 403 Forbidden

// ZONE_LEADER: Cannot create members
POST /api/members → 403 Forbidden
```

---

## Future Enhancements

Consider adding these roles as you grow:
- **AUDITOR**: Read-only access to all data (compliance)
- **FINANCE_OFFICER**: Access to financial data only
- **VISITOR_COORDINATOR**: Manage visitor follow-ups

(A department/ministry-scoped leader role and communications permissions have already shipped as `DEPARTMENT_LEADER` and `manage:communications`/`send:communications`.)
