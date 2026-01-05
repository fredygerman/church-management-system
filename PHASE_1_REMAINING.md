# Phase 1 Remaining Work Summary

**Last Updated:** January 4, 2026  
**Current Status:** Permission System Complete ✅ → Frontend Integration In Progress 🔄

---

## ✅ COMPLETED WORK

### Backend Permission System (FULLY COMPLETE)
- [x] Three-layer guard architecture implemented (ChurchContext → Permission → ZoneContext)
- [x] Role-based permission system with PERMISSION_MAP (14 actions)
- [x] All 26 Phase 1 endpoints decorated with @RequirePermission
- [x] Guards registered globally in app.module
- [x] Database migrations applied successfully
- [x] Type system fully exported from @church/db
- [x] Permission system documentation completed

### Frontend Routing Migration (✅ JUST COMPLETED)
- [x] Changed all routes from `[workspaceId]` to `[churchId]`
- [x] Updated all page.tsx files in [churchId] directory structure
- [x] Updated action files to use `churchId` instead of `workspaceId`
- [x] Updated all component references (MemberForm, DashboardSidebar, SetupChurch)
- [x] Renamed `getWorkspaceMembersCount` to `getChurchMembersCount`
- [x] Updated church.ts actions to work with churchId

### Frontend Navigation (✅ COMPLETE)
- [x] DashboardSidebar uses churchId in URLs
- [x] MemberForm redirects to churchId-based routes
- [x] All links use /${churchId}/... pattern

---

## 🔄 IN PROGRESS / BLOCKED

### Frontend Data Fetching Architecture
**Status:** Ready to implement  
The frontend needs to be updated to:
1. Fetch current user and their church assignment from API
2. Eliminate remaining local state (no more ChurchProvider in providers)
3. Pass churchId to all server actions and API calls

**Files to update:**
- `/apps/web/app/(home)/page.tsx` - Should redirect HQ users to church selection
- `/apps/web/components/providers/providers.tsx` - Already removed ChurchProvider ✅
- API calls in action files need to include churchId context

---

## 📋 REMAINING TASKS FOR PHASE 1

### 1. Church Setup Flow (For HQ Users) - Priority: HIGH
**Status:** Not started  
When a SUPER_ADMIN logs in with no churches assigned:
- [ ] Detect if user has no church assignment
- [ ] Show church setup page instead of dashboard
- [ ] Create initial church → redirect to dashboard

**Files needed:**
- [ ] Create `/apps/web/app/setup/page.tsx` - Initial church creation flow
- [ ] Update `/apps/web/app/layout.tsx` or middleware to detect HQ setup state
- [ ] SetupChurch component is ready, just needs to be wired up

### 2. Church Selection / Switching - Priority: HIGH
**Status:** Partially done  
When user logs in with access to multiple churches:
- [ ] List available churches on home page
- [ ] User can click to enter a specific church
- [ ] URL changes to `/{churchId}/dashboard`
- [ ] Sidebar reflects current church selection

**Files to update:**
- [ ] `/apps/web/app/(home)/page.tsx` - Improve church selection UI
- [ ] WorkspaceCard component - Update to work with churchId
- [ ] WorkspaceSwitcher component - Update to switch churchId in URL

### 3. API Integration - Priority: HIGH
**Status:** Partially done  
All API calls need to include churchId context:
- [ ] Update `getMembers()` action to pass churchId to API
- [ ] Update `getZones()` action to pass churchId to API
- [ ] Update `getFamilies()` action to pass churchId to API  
- [ ] Update `getVisitors()` action to pass churchId to API
- [ ] Add churchId to all POST/PUT/DELETE requests

**Affected files:**
- `/apps/web/actions/member.ts`
- `/apps/web/actions/zone.ts` (if exists)
- `/apps/web/actions/family.ts` (if exists)
- `/apps/web/actions/visitor.ts` (if exists)

### 4. Permission-Based UI - Priority: MEDIUM
**Status:** Not started  
Hide/show UI elements based on user role:
- [ ] Add `useUser()` hook to client components
- [ ] Hide add/edit/delete buttons for read-only users
- [ ] Show admin-only sections only for SUPER_ADMIN/BRANCH_ADMIN
- [ ] Zone-specific filtering for JUMUIYA_LEADER role

### 5. Frontend Pages Completion - Priority: MEDIUM

#### Members Module
- [x] `/[churchId]/dashboard/members/add` - Create member form ✅
- [x] `/[churchId]/dashboard/members` - Members list with pagination ✅
- [ ] `/[churchId]/dashboard/members/[memberId]` - Member detail page
- [ ] `/[churchId]/dashboard/members/[memberId]/edit` - Edit member form

#### Zones Module
- [ ] `/[churchId]/dashboard/zones` - List zones
- [ ] `/[churchId]/dashboard/zones/add` - Create zone form
- [ ] `/[churchId]/dashboard/zones/[zoneId]/edit` - Edit zone form
- [ ] `/[churchId]/dashboard/zones/[zoneId]` - Zone detail with members

#### Families Module
- [ ] `/[churchId]/dashboard/families` - List families
- [ ] `/[churchId]/dashboard/families/[familyId]` - Family detail

#### Visitors Module
- [ ] `/[churchId]/dashboard/visitors` - Visitor list
- [ ] `/[churchId]/dashboard/visitors/add` - Quick add visitor form
- [ ] `/[churchId]/dashboard/visitors/[visitorId]` - Visitor followup tracking

#### Dashboard
- [x] `/[churchId]/dashboard` - Redirect to main dashboard ✅
- [ ] `/[churchId]/dashboard/home` - Main dashboard with stats
- [ ] Stats: Total members, Active zones, Pending visitors
- [ ] Recent activity feed

#### Settings
- [ ] `/[churchId]/settings/church` - Edit church details
- [ ] `/[churchId]/settings/users` - Manage church users
- [ ] `/[churchId]/settings/roles` - Assign roles (if complex)

### 6. Data Tables & Components - Priority: MEDIUM
- [x] MemberTable component ✅
- [ ] ZoneTable component (with edit/delete actions)
- [ ] FamilyTable component
- [ ] VisitorTable component with status badges
- [ ] Status filter dropdowns

### 7. Database Schema Alignment - Priority: HIGH
**Status:** Needs verification  
Ensure API database schema matches frontend expectations:
- [ ] Verify members table has churchId (not workspaceId)
- [ ] Verify all tables have church_id foreign key
- [ ] Verify soft-delete fields (is_deleted)
- [ ] Verify all foreign key relationships

### 8. Testing - Priority: MEDIUM
- [ ] Test member creation for church isolation
- [ ] Test permission guards reject unauthorized access
- [ ] Test zone filtering for jumuiya_leader role
- [ ] Test visitor tracking workflow
- [ ] Test cross-church data isolation

### 9. Error Handling & Validation - Priority: LOW
- [ ] Add user-friendly error messages for API failures
- [ ] Implement retry logic for failed requests
- [ ] Add validation for date fields
- [ ] Add validation for phone number formats

### 10. Documentation - Priority: LOW
- [ ] Update API docs with churchId in examples
- [ ] Document permission requirements for each endpoint
- [ ] Add user guide for HQ staff
- [ ] Add troubleshooting guide

---

## 🎯 CRITICAL PATH (Fastest Route to Working System)

1. **Setup Flow** (1-2 hours)
   - Create setup page for HQ users with no church
   - Wire up SetupChurch component
   - Test church creation → redirect flow

2. **Church Selection** (1-2 hours)
   - Update home page to show church cards
   - Implement church switching (URL change)
   - Verify all churchId params flow correctly

3. **API Integration** (2-3 hours)
   - Add churchId to API requests in action files
   - Test data isolation (same data only for same church)
   - Verify permission guards work

4. **Missing Pages** (3-4 hours)
   - Create zone/family/visitor list pages
   - Implement detail pages with edit forms
   - Add proper data loading states

5. **Testing & Bug Fixes** (2-3 hours)
   - Manual testing of complete flows
   - Fix any data isolation issues
   - Fix permission-related bugs

**Total Estimated Time:** 9-14 hours

---

## 🔧 QUICK START CHECKLIST

To resume work immediately:

- [ ] Verify API endpoints are running and accessible
- [ ] Test one API endpoint from Postman with churchId param
- [ ] Update one action file to pass churchId to API
- [ ] Update one page component to display the result
- [ ] Test end-to-end: Click → API call → Data displayed

---

## 📊 Progress Tracker

| Component | Status | Completion |
|-----------|--------|-----------|
| Permission System | ✅ Complete | 100% |
| Routing ([churchId]) | ✅ Complete | 100% |
| Pages (Members) | 🟡 Partial | 50% |
| Pages (Zones) | ⚪ Todo | 0% |
| Pages (Families) | ⚪ Todo | 0% |
| Pages (Visitors) | ⚪ Todo | 0% |
| API Integration | 🟡 Partial | 30% |
| Auth & Guards | ✅ Complete | 100% |
| UI Components | 🟡 Partial | 40% |
| Testing | ⚪ Todo | 5% |

**Overall Phase 1 Completion: ~45-50%**

---

## 🚀 NEXT IMMEDIATE ACTION

1. Pick **one feature** from the critical path above
2. Implement the setup flow (easiest, unblocks everything else)
3. Test end-to-end with one church
4. Then move to church selection
5. Then expand to other modules

The permission system is rock solid. Focus now is on connecting frontend to backend with proper church context.
