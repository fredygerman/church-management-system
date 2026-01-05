# Phase 1 Permission System Implementation

## Overview

The permission system uses **Role-Based Access Control (RBAC)** with **Church Context Enforcement**. It consists of three layers of guards that work together to ensure secure data access.

---

## Architecture

### Three Layers of Security

```
Request → JWT Guard (Authenticate)
        → Church Context Guard (Enforce churchId isolation)
        → Permission Guard (Check role permissions)
        → Zone Context Guard (Check zone access for leaders)
        → Handler (Execute)
```

---

## 1. Role Enum

**File:** `apps/api/src/auth/types/permission.types.ts`

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',         // HQ - God's eye view
  BRANCH_ADMIN = 'branch_admin',       // Local pastor/secretary
  ZONE_LEADER = 'ZONE_LEADER',   // Small group leader
  MEMBER = 'member',                   // Regular member
}
```

### Role Capabilities

| Role | Can Create | Can Read | Can Update | Can Delete | Can Manage |
|------|---|---|---|---|---|
| super_admin | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All |
| branch_admin | ✓ Own church | ✓ Own church | ✓ Own church | ✗ | ✓ Own church |
| ZONE_LEADER | ✗ | ✓ Own zone | ✗ | ✗ | ✗ |
| member | ✗ | ✓ Own profile | ✓ Own profile | ✗ | ✗ |

---

## 2. User Context

Every authenticated user has a context attached:

```typescript
interface UserContext {
  id: string                    // User ID
  email: string                 // Email
  role: UserRole               // One of the 4 roles
  churchId: string             // Church they belong to (mandatory)
  assignedZoneId?: string      // Zone they manage (ZONE_LEADER only)
  workspaceId: string          // Workspace/organization
  isActive: boolean            // Account active status
}
```

---

## 3. Permission Guards

### Guard 1: JWT Auth Guard (Existing)

- Validates JWT token
- Extracts user context
- Attaches to `request.user`

### Guard 2: Church Context Guard

**File:** `apps/api/src/auth/guards/church-context.guard.ts`

**What it does:**
- Ensures user only accesses their own church
- Super admin can access all churches
- Validates `churchId` from params/query/body matches `user.churchId`

**Example:**
```typescript
// ✓ Branch Admin from Dar accessing their own church
GET /api/members?churchId=dar-es-salaam  // ALLOWED

// ✗ Branch Admin from Dar trying to access Moshi
GET /api/members?churchId=moshi          // FORBIDDEN
```

### Guard 3: Permission Guard

**File:** `apps/api/src/auth/guards/permission.guard.ts`

**What it does:**
- Checks if user's role has permission for the action
- Uses `@RequirePermission()` decorator on endpoints
- Returns 403 Forbidden if user lacks permission

**Example:**
```typescript
@Post('members')
@RequirePermission('create:member')  // Only branch_admin & super_admin
createMember(@Body() dto: CreateMemberDto) { ... }
```

### Guard 4: Zone Context Guard

**File:** `apps/api/src/auth/guards/zone-context.guard.ts`

**What it does:**
- Only enforces for `ZONE_LEADER` role
- Ensures leader only accesses their assigned zone
- Automatically injects `user.assignedZoneId` if not specified

**Example:**
```typescript
// Zone Leader trying to view own zone members
GET /api/zones/zone-001/members  // ALLOWED (matches assignedZoneId)

// Zone Leader trying to access another zone
GET /api/zones/zone-002/members  // FORBIDDEN
```

---

## 4. Using @RequirePermission Decorator

This decorator specifies which permission is required for an endpoint.

### Setup

Import the decorator:
```typescript
import { RequirePermission } from '@/auth/decorators/require-permission.decorator'
```

### Usage Examples

```typescript
// Only super_admin & branch_admin can create members
@Post('members')
@RequirePermission('create:member')
createMember(@Body() dto: CreateMemberDto) { ... }

// Any authenticated user can read members (but church context still applies)
@Get('members')
@RequirePermission('read:member')
getMembers(@Query('churchId') churchId: string) { ... }

// Only branch_admin & super_admin can manage zones
@Post('zones')
@RequirePermission('manage:zones')
createZone(@Body() dto: CreateZoneDto) { ... }

// Only super_admin can delete members
@Delete('members/:id')
@RequirePermission('delete:member')
deleteMember(@Param('id') id: string) { ... }
```

---

## 5. Available Permissions

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
'manage:departments' // Manage departments/ministries
'create:visitation'  // Log pastoral visits
'read:visitation'    // View visitation logs
```

---

## 6. Implementation Checklist

### For Each Endpoint

1. **Identify required permission** - What action is this?
   ```typescript
   POST /members → 'create:member'
   GET /members → 'read:member'
   PUT /members/:id → 'update:member'
   ```

2. **Add @RequirePermission decorator**
   ```typescript
   @Post()
   @RequirePermission('create:member')
   create() { ... }
   ```

3. **Ensure churchId is passed**
   ```typescript
   // In request:
   - Params: /api/churches/:churchId/members
   - Query: ?churchId=xxx
   - Body: { churchId, ...data }
   ```

4. **For zone-specific endpoints, pass zoneId**
   ```typescript
   // For ZONE_LEADER, ensure zoneId validation
   GET /zones/:zoneId/members
   ```

---

## 7. Real-World Scenarios

### Scenario 1: Create Member

```typescript
Request: POST /api/members
Body: { churchId: "dar-es-salaam", firstName: "John", ... }
User: branch_admin from Dar

Guards check:
1. JWT Valid? ✓
2. churchId (dar-es-salaam) == user.churchId (dar-es-salaam)? ✓
3. branch_admin has 'create:member'? ✓
4. Zone check? N/A (not a leader)

Result: ✓ ALLOWED
```

### Scenario 2: Leader Viewing Members

```typescript
Request: GET /api/zones/zone-001/members
User: ZONE_LEADER with assignedZoneId: "zone-001"

Guards check:
1. JWT Valid? ✓
2. churchId matches? ✓ (from user token)
3. ZONE_LEADER has 'read:member'? ✓
4. assignedZoneId (zone-001) == requested zoneId (zone-001)? ✓

Result: ✓ ALLOWED
```

### Scenario 3: Unauthorized Access

```typescript
Request: DELETE /api/members/123
User: branch_admin

Guards check:
1. JWT Valid? ✓
2. churchId matches? ✓
3. branch_admin has 'delete:member'? ✗

Result: ✗ 403 FORBIDDEN
(Only super_admin can delete)
```

---

## 8. Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
Caused by: Invalid/expired JWT token

### 403 Forbidden (Church Context)
```json
{
  "statusCode": 403,
  "message": "You do not have access to this church. Access denied."
}
```
Caused by: churchId mismatch

### 403 Forbidden (Permission)
```json
{
  "statusCode": 403,
  "message": "You do not have permission to create:member. Required role: create:member"
}
```
Caused by: Role lacks permission

### 403 Forbidden (Zone Context)
```json
{
  "statusCode": 403,
  "message": "You can only access members from your assigned zone"
}
```
Caused by: Zone leader accessing wrong zone

---

## 9. Phase 2 & 3 Expansion

### Adding New Roles (Phase 2)

```typescript
enum UserRole {
  // ... existing roles
  PASTOR = 'pastor',              // Can visit members
  DEPARTMENT_HEAD = 'department_head',  // Can manage dept
}

// Add their permissions
const PERMISSION_MAP = {
  // ... existing
  [UserRole.PASTOR]: [
    'read:member',
    'create:visitation',
    'read:visitation',
  ],
  [UserRole.DEPARTMENT_HEAD]: [
    'read:member',  // Dept members only
    'manage:departments',
  ],
}
```

### Adding New Permissions (Phase 3)

```typescript
type PermissionAction =
  | // ... existing permissions
  | 'create:tithe'        // Record tithe
  | 'read:tithe'          // View tithe data
  | 'approve:expense'     // Approve expense
  | 'generate:report'     // Finance reports

// Add to PERMISSION_MAP as needed
```

---

## 10. Testing Guards

### Unit Test Example

```typescript
describe('PermissionGuard', () => {
  it('should allow branch_admin to create members', () => {
    const user = {
      id: '123',
      role: UserRole.BRANCH_ADMIN,
      churchId: 'dar-es-salaam',
    }

    const canActivate = guard.canActivate(context)
    expect(canActivate).toBe(true)
  })

  it('should deny ZONE_LEADER from creating members', () => {
    const user = {
      id: '456',
      role: UserRole.ZONE_LEADER,
      churchId: 'dar-es-salaam',
      assignedZoneId: 'zone-001',
    }

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })
})
```

---

## Summary

**Three guards, three questions:**
1. **JWT Guard:** Are you who you say you are?
2. **Church Context Guard:** Do you belong to this church?
3. **Permission Guard:** Does your role allow this action?
4. **Zone Guard:** Are you accessing only your zone?

Simple. Secure. Scalable.
