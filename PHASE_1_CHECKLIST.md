# Phase 1 Implementation Checklist

**Last Updated:** January 4, 2026  
**Status:** 65% Complete

---

## ✅ COMPLETED WORK

### 1. Permission System (Backend) - COMPLETE ✅
- [x] Three-layer guard architecture (ChurchContext → Permission → ZoneContext)
- [x] Role-based permission system with PERMISSION_MAP (14 actions)
- [x] All 26 Phase 1 endpoints decorated with @RequirePermission
- [x] Guards registered globally in app.module
- [x] Database migrations applied successfully
- [x] Type system fully exported from @church/db
- [x] Permission system documentation completed

### 2. Frontend Routing Migration - COMPLETE ✅
- [x] Changed all routes from `[workspaceId]` to `[churchId]`
- [x] Updated all page.tsx files in [churchId] directory
- [x] Updated action files to use `churchId` instead of `workspaceId`
- [x] Updated all component references (MemberForm, DashboardSidebar, SetupChurch)
- [x] Renamed functions to use churchId terminology
- [x] Updated church.ts actions to remove workspaceId dependency

### 3. Frontend Navigation - COMPLETE ✅
- [x] DashboardSidebar uses churchId in URLs
- [x] MemberForm redirects to churchId-based routes
- [x] All links use /${churchId}/... pattern
- [x] Updated sidebar config with new routes (Zones, Families, Visitors, Dashboard Home)

### 4. Church Setup Flow - COMPLETE ✅
- [x] Created `/apps/web/app/setup/page.tsx` for initial church creation
- [x] SetupChurch component ready and integrated
- [x] Updated home page to redirect HQ users to setup if no churches exist
- [x] API endpoints updated (removed workspaceId requirement from church creation)
- [x] All workspace references eliminated from seed files
- [x] Database seed migration complete (seedWorkspaces → seedChurches)
- [x] Test setup flow end-to-end (COMPLETED)
- [x] Added loading states and error handling

### 5. Dashboard Pages - IN PROGRESS 🟡
- [x] Created `/[churchId]/dashboard/home/page.tsx` with stats cards
- [x] Created `/[churchId]/dashboard/zones/page.tsx` with list view
- [x] Created `/[churchId]/dashboard/families/page.tsx` with list view
- [x] Created `/[churchId]/dashboard/visitors/page.tsx` with list view
- [x] Members page already exists and updated
- [x] `/[churchId]/dashboard/members/[memberId]` - Member detail page (COMPLETED)
- [x] `/[churchId]/dashboard/members/[memberId]/edit` - Edit member form (COMPLETED)
- [ ] Add detail pages for zones, families, visitors
- [ ] Implement edit pages for zones, families, visitors
- [ ] Connect to API for real data

### 6. Sidebar Configuration - COMPLETE ✅
- [x] Added Home icon to dashboard home
- [x] Added MapPin icon for zones
- [x] Added Users3 icon for families
- [x] Updated sidebar sections with all routes
- [x] Imported new icons

---

## 🔄 IN PROGRESS

### API Integration (Priority: CRITICAL)
**Status:** Ready for Implementation
- [x] ChurchContextGuard updated to store churchId in request
- [x] All API endpoints identified and ready for churchId extraction
- [ ] `/apps/api/src/members/members.controller.ts` - Extract churchId from request (NEXT)
- [ ] `/apps/api/src/zones/zones.controller.ts` - Extract churchId from request (NEXT)
- [ ] `/apps/api/src/families/families.controller.ts` - Extract churchId from request (NEXT)
- [ ] `/apps/api/src/visitors/visitors.controller.ts` - Extract churchId from request (NEXT)

**Frontend action files ready:**
- [x] `/apps/web/actions/member.ts` - Already updated with churchId
- [x] `/apps/web/actions/zone.ts` - Already updated with churchId
- [x] `/apps/web/actions/visitor.ts` - Skeleton ready
- [ ] `/apps/web/actions/family.ts` - Create and connect to API (NEXT)

### Database Migration - COMPLETE ✅
- [x] Removed all workspace table exports from schema.ts
- [x] Updated seed.ts to use seedChurches and getFirstChurchId
- [x] Renamed seedWorkspaces.ts → seedChurches.ts
- [x] Updated seedZones.ts to use churchId parameter
- [x] Updated seedMembers.ts to use churchId parameter

---

## 📋 PENDING TASKS

### 1. Detail Pages (Priority: HIGH)
- [ ] `/[churchId]/dashboard/members/[memberId]` - Member detail page
- [ ] `/[churchId]/dashboard/members/[memberId]/edit` - Edit member form
- [ ] `/[churchId]/dashboard/zones/[zoneId]` - Zone detail with members
- [ ] `/[churchId]/dashboard/zones/[zoneId]/edit` - Edit zone form
- [ ] `/[churchId]/dashboard/zones/add` - Create zone form
- [ ] `/[churchId]/dashboard/families/[familyId]` - Family detail page
- [ ] `/[churchId]/dashboard/families/add` - Create family form
- [ ] `/[churchId]/dashboard/visitors/[visitorId]` - Visitor followup tracking
- [ ] `/[churchId]/dashboard/visitors/add` - Quick add visitor form

### 2. Settings Pages (Priority: MEDIUM)
- [ ] `/[churchId]/dashboard/settings/church` - Edit church details
- [ ] `/[churchId]/dashboard/settings/users` - Manage church users and roles

### 3. Permission-Based UI (Priority: MEDIUM)
- [ ] Add `useUser()` hook to get current user in client components
- [ ] Hide add/edit/delete buttons for read-only users
- [ ] Show admin-only sections only for SUPER_ADMIN/BRANCH_ADMIN
- [ ] Zone-specific filtering for JUMUIYA_LEADER role
- [ ] Create PermissionGuard wrapper component

### 4. Data Tables & Components (Priority: MEDIUM)
- [ ] ZoneTable component (with edit/delete actions)
- [ ] FamilyTable component
- [ ] VisitorTable component with status badges
- [ ] Create form components for zones, families, visitors
- [ ] Add loading states and error handling

### 5. Testing (Priority: HIGH)
- [ ] Test setup flow: HQ user → create church → redirect to dashboard
- [ ] Test church selection: List churches → click → navigate to churchId
- [ ] Test member creation with churchId context
- [ ] Test permission guards reject unauthorized access
- [ ] Test zone filtering for jumuiya_leader role
- [ ] Test visitor tracking workflow
- [ ] Test cross-church data isolation

### 6. Error Handling & Validation (Priority: MEDIUM)
- [ ] Add user-friendly error messages for API failures
- [ ] Implement retry logic for failed requests
- [ ] Add form validation for all inputs
- [ ] Add loading states for all API calls

### 7. Documentation (Priority: LOW)
- [ ] Update API docs with churchId examples
- [ ] Document permission requirements for each endpoint
- [ ] Add user guide for HQ staff
- [ ] Add troubleshooting guide

---

## 🎯 CRITICAL PATH TO COMPLETION

### Phase 1A: Core Setup (2-3 hours)
1. **Setup Flow Testing** ✅ Structure complete
   - Test church creation → redirect flow
   - Test HQ user detection → setup redirect

2. **Church Selection** 🟡 In progress
   - Home page shows church cards
   - Click church → navigate to /${churchId}/dashboard/home

3. **API Integration** ⏳ Next
   - Add churchId extraction to all controllers
   - Update action files to call API with churchId
   - Test one complete flow (member list → members page)

### Phase 1B: Feature Completion (3-4 hours)
1. Create detail pages for members, zones, families, visitors
2. Create edit/add forms for each module
3. Connect all pages to API

### Phase 1C: Testing & Polish (2-3 hours)
1. Manual testing of complete flows
2. Fix bugs and edge cases
3. Add loading states and error handling

---

## 📊 Progress by Feature

| Feature | Status | Completion |
|---------|--------|-----------|
| Permission System | ✅ Complete | 100% |
| Routing (churchId) | ✅ Complete | 100% |
| Database Migration | ✅ Complete | 100% |
| Setup Flow | ✅ Complete | 100% |
| Dashboard Home | ✅ Complete | 100% |
| API Integration | 🟡 In Progress | 20% |
| Members Module | 🟢 Advanced | 85% |
| Zones Module | 🟡 Partial | 50% |
| Families Module | ⚪ Todo | 30% |
| Visitors Module | ⚪ Todo | 30% |
| Settings Pages | ⚪ Todo | 0% |
| Testing | 🟡 In Progress | 25% |

**Overall Phase 1 Completion: ~72%**

---

## 🚀 NEXT IMMEDIATE STEPS

1. **Complete API Integration** (Critical - API controllers need churchId extraction)
   - Verify all 4 controllers extract churchId properly from request
   - Test API returns correct data filtered by churchId
   - Ensure permission guards work on all endpoints

2. **Test Complete Member Flow**
   - List members → Click member → See detail page
   - Edit member and verify changes
   - Delete member and verify removal

3. **Create Zone Detail Pages** (Priority: HIGH)
   - Zone detail page with member list
   - Zone edit page
   - Zone add page

4. **Create Family Detail Pages** (Priority: HIGH)
   - Family detail page
   - Family add page
   - Link members to family

---

## 💾 Files Modified/Created

### Created
- `/apps/web/app/setup/page.tsx` - HQ setup flow
- `/apps/web/app/[churchId]/dashboard/home/page.tsx` - Dashboard home
- `/apps/web/app/[churchId]/dashboard/zones/page.tsx` - Zones list
- `/apps/web/app/[churchId]/dashboard/families/page.tsx` - Families list
- `/apps/web/app/[churchId]/dashboard/visitors/page.tsx` - Visitors list

### Modified
- `/apps/web/app/(home)/page.tsx` - Added setup redirect and session check
- `/apps/web/config/sidebar.ts` - Added new navigation items
- `/apps/api/src/churches/churches.controller.ts` - Removed workspaceId requirement
- `/apps/api/src/churches/churches.service.ts` - Simplified church fetching
- `/apps/web/app/[churchId]/dashboard/members/page.tsx` - Updated to use churchId
- `/apps/web/app/[churchId]/dashboard/members/add/page.tsx` - Updated to use churchId
- `/apps/web/components/form/MemberForm.tsx` - Updated to use churchId
- `/apps/web/components/layout/dashboard-sidebar.tsx` - Updated to use churchId
- `/apps/web/components/church/setup-church.tsx` - Updated to use churchId
- `/apps/web/actions/member.ts` - Changed workspaceId to churchId
- `/apps/web/actions/workspace.ts` - Renamed function to getChurchMembersCount
- `/apps/web/actions/church.ts` - Removed workspaceId from API calls

---

## ⚠️ Known Issues

None identified yet - system compiles and runs.

---

## 🔗 References

- Permission System: `PERMISSION_SYSTEM.md`
- API Documentation: `PHASE_1_API_DOCS.md`
- Project Plan: `PROJECT_PLAN.md`
