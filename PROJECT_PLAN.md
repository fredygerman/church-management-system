# Mito ya Baraka Church - Project Plan

## Overview
Multi-branch church management system with phased rollout focusing on People & Structure first, then Operations, then Finance.

**Current Status:** Phase 1, 2 & 3 complete ✅ — all originally scoped phases shipped

---

## Phase 1: Digital Shepherd (Identity & Hierarchy)

### 1.1 Multi-Church Architecture ✅ COMPLETE
- [x] Branch profiles (HQ + all local branches)
- [x] Store: Branch name, location, lead pastor, contact info
- [x] Role-based access: Super Admin (HQ) | Branch Admin (Local)
- [x] Church context enforcement at API level
- [x] Multi-tenancy with churchId isolation

### 1.2 Comprehensive Member Directory ✅ COMPLETE
- [x] Personal data: Name, Phone, DOB, Gender, Occupation
- [x] Spiritual data: Salvation date, Baptism status (Maji & Roho Mtakatifu), Marriage status
- [x] Family linking: Link households (spouses, children)
- [x] Member CRUD operations with permissions
- [x] Member search functionality
- [x] Bulk member import/export

### 1.3 Zone & Cell Group (Zone) Management ✅ COMPLETE
- [x] Assign members to Zones by residence
- [x] Designate group leaders
- [x] Track leader-to-member responsibility
- [x] Auto-assign zone creator as leader
- [x] Leader reassignment validation workflow
- [x] Add existing members via searchable dropdown
- [x] Zone member management (assign/remove)

### 1.4 First-Time Visitor (Wageni) Pipeline ✅ COMPLETE
- [x] Separate visitors table (independent from members)
- [x] Visitor entry form (Sunday intake)
- [x] Follow-up tracking: Not Called → Called → Visited → Converted/Dropped
- [x] Convert visitor to member workflow (creates new member record)
- [x] Visitor dashboard and analytics
- [x] Track visitor source (Friend, Flyer, Walk-in, etc.)
- [x] Referred by member tracking

---

## Phase 2: Ministry Operations (Engagement & Care)

### 2.1 Attendance & Service Management ✅ COMPLETE
- [x] Define service types (Sunday, Mid-week, All-night prayers)
- [x] Headcount tracking (Men, Women, Children, Visitors)
- [x] Individual check-in (QR + manual) for leaders/workers
- [x] Attendance sessions, trends, and risk insights

### 2.2 Communication Hub (SMS) ✅ COMPLETE
- [x] Bulk SMS/email campaigns by recipient group
- [x] Automated birthday & anniversary notifications (family-lifecycle milestone rules)
- [x] Message templates (SMS + email, with variable substitution)
- [x] Campaign tracking (recipients, events, status)

### 2.3 Department/Ministry Management ✅ COMPLETE
- [x] Create ministries (Choir, Ushers, Intercessors) — multi-department membership, multi-leader per department (design: `docs/superpowers/specs/2026-08-09-department-ministry-management-design.md`)
- [x] Assign members to departments, toggle leader per member (no reassignment dialog needed — multiple leaders coexist)
- [x] Member/leader counts per department (per-church stats; no separate cross-branch aggregate view — admins switch church context to compare branches)
- [x] Department attendance tracking (`department` groupBy on the existing attendance trends/comparison endpoints — analytics only, no separate check-in system)
- [x] `department_leader` role, scoped read-only to their led department(s) via a live-query guard (`DepartmentContextGuard`)

### 2.4 Beyond original scope (already shipped)
- [x] Multi-church membership (a member can belong to more than one church)
- [x] Member self-service portal (profile, attendance, prayer requests, announcements, family)
- [x] Prayer request feature
- [x] Data-quality workflows (import de-duplication)
- [x] Family lifecycle milestones (birthday/anniversary/baptism notification rules)

---

## Phase 3: Giving & Events

### 3.1 Offering Management ✅ COMPLETE
- [x] Simple offering tracking
- [x] Member contribution history
- [x] Offering categories (per-church configurable)
- [x] Basic giving reports

### 3.1b Giving Goals ✅ COMPLETE
- [x] Time-bound fundraising goals with a target amount and deadline
- [x] Live progress tracking (offerings link to a goal independent of category)
- [x] Per-goal public/private visibility toggle
- [x] Opt-in donor wall (names only, never amounts)

### 3.2 Calendar & Event Planning ✅ COMPLETE
- [x] Shared HQ calendar (network-scope events, publish-gated to super_admin/admin)
- [x] Branch-specific calendars (church-scope events, the default)
- [x] Event RSVP and attendance tracking (RSVP-based, no service-session cloning)

---

## Technical Architecture

### Database Strategy ✅ COMPLETE

- Every entity must have `church_id` foreign key
- Examples: Member, Attendance, Department, Service, VisitationLog
- Enforce multi-tenancy at schema level

### Backend (NestJS) ✅ COMPLETE

- [x] Church context middleware on all requests
- [x] Permission guards: HQ vs. Branch Admin
- [x] Filtering logic: Super Admin (optional church_id) | Branch Admin (mandatory church_id)
- [x] JWT authentication with role-based access
- [x] Drizzle ORM with PostgreSQL

### Frontend (Next.js) ✅ COMPLETE

- [x] Church context selector in top nav (HQ users only)
- [x] Default view based on logged-in user's role
- [x] Dynamic filtering of all data views
- [x] Server Actions for mutations
- [x] React Server Components for reads

---

## Database Schema (Phase 1) ✅ COMPLETE

- Church
- Member
- Family (links to members)
- Zone / Zone
- User (with role & church assignment)
- Visitor (Wageni tracking)
- MemberZones (junction table)

---

## Success Metrics (Phase 1) ✅ ACHIEVED

✓ All members and branches mapped in system  
✓ HQ has complete visibility; Branch admins see only their branch  
✓ Visitor follow-up system operational  
✓ Zone management with leader assignment  
✓ Family linking functional  
✓ Permission system enforcing role-based access  

---

## Next Steps (Phase 3)

1. ~~**Offering Tracking** - Simple offering and contribution history~~ ✅ Shipped as Phase 3.1, see `docs/superpowers/specs/2026-08-10-offering-management-design.md`.
2. ~~**Giving Goals** - Fundraising goals/campaigns with target amounts and progress tracking~~ ✅ Shipped as Phase 3.1b, see `docs/superpowers/specs/2026-08-10-giving-goals-design.md`.
3. ~~**Calendar & Events** - Event planning and RSVP tracking~~ ✅ Shipped as Phase 3.2, see `docs/superpowers/specs/2026-08-10-calendar-events-design.md`. Phase 3 (Giving & Events) is now complete.
