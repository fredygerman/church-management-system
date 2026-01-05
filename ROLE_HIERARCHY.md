# Role Hierarchy & Permissions

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
- ✅ create:visitation
- ✅ read:visitation

---

### 4. **ZONE_LEADER** (Cell Group Leadership)
- Manage their assigned zone/jumuiya only
- Cannot create members
- Read and track visitations
- **Use Case**: Zone coordinators, jumuiya leaders

**Permissions:**
- ❌ create:member
- ✅ read:member
- ❌ update:member
- ❌ delete:member
- ❌ manage:zones
- ✅ view:families
- ❌ view:visitors
- ❌ create:visitor
- ❌ update:visitor
- ❌ manage:departments
- ✅ create:visitation
- ✅ read:visitation

---

### 5. **MEMBER** (Regular Members)
- View own profile only
- Cannot perform administrative tasks

**Permissions:**
- ❌ create:member
- ✅ read:member (own profile)
- ❌ update:member
- ❌ delete:member
- ❌ manage:zones
- ❌ view:families
- ❌ view:visitors
- ❌ create:visitor
- ❌ update:visitor
- ❌ manage:departments
- ❌ create:visitation
- ❌ read:visitation

---

## Quick Comparison Table

| Permission | SUPER_ADMIN | ADMIN | BRANCH_ADMIN | ZONE_LEADER | MEMBER |
|-----------|:-----------:|:-----:|:------------:|:-----------:|:------:|
| Create Member | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read Member | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update Member | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Member | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Zones | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Families | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Visitors | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Visitor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Departments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Visitation | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Access Scope

| Role | Scope | Context |
|------|-------|---------|
| SUPER_ADMIN | All churches | None - global |
| ADMIN | All churches | None - global (IT focus) |
| BRANCH_ADMIN | Single church | churchId (required) |
| ZONE_LEADER | Single zone | assignedZoneId (required) |
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
```typescript
// Permission Guard (checks abilities)
@UseGuards(PermissionGuard)

// Church Context Guard (enforces churchId for BRANCH_ADMIN)
@UseGuards(ChurchContextGuard)

// Zone Context Guard (enforces zoneId for ZONE_LEADER)
@UseGuards(ZoneContextGuard)
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
- **COMMUNICATIONS_LEAD**: Manage announcements/messages
- **VISITOR_COORDINATOR**: Manage visitor follow-ups
