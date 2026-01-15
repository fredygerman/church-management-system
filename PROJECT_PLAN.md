# Mito ya Baraka Church - Project Plan

## Overview
Multi-branch church management system with phased rollout focusing on People & Structure first, then Operations, then Finance.

**Current Status:** Phase 1 - 85% Complete ✅

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

## Phase 2: Ministry Operations (Engagement & Care) 🚧 NEXT

### 2.1 Attendance & Service Management 🎯 HIGH PRIORITY
- [ ] Define service types (Sunday, Mid-week, All-night prayers)
- [ ] Headcount tracking (Men, Women, Children, Visitors)
- [ ] Optional: Individual check-in for leaders/workers
- [ ] Attendance reports and trends

### 2.2 Communication Hub (SMS) 🎯 HIGH PRIORITY
- [ ] Bulk SMS by group (Choir, Zone Leaders, etc.)
- [ ] Automated birthday SMS
- [ ] Event reminder SMS
- [ ] SMS templates management

### 2.3 Department/Ministry Management
- [ ] Create ministries (Choir, Ushers, Intercessors)
- [ ] Assign members to departments
- [ ] Track workforce across branches
- [ ] Department attendance tracking

---

## Phase 3: Giving & Events

### 3.1 Offering Management
- [ ] Simple offering tracking
- [ ] Member contribution history
- [ ] Offering categories (Tithes, Offerings, Thanksgiving)
- [ ] Basic giving reports

### 3.2 Calendar & Event Planning
- [ ] Shared HQ calendar (Camp meetings, Seminars)
- [ ] Branch-specific calendars
- [ ] Event RSVP and attendance tracking

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

## Next Steps (Phase 2 Priority)

1. **Attendance Tracking** - Service attendance with headcount
2. **SMS Integration** - Bulk messaging and automated birthday wishes
3. **Department Management** - Ministry assignment and tracking
4. **Calendar & Events** - Event planning and RSVP tracking
5. **Offering Tracking** - Simple offering and contribution history
