# Mito ya Baraka Church - Project Plan

## Overview
Multi-branch church management system with phased rollout focusing on People & Structure first, then Operations, then Finance.

---

## Phase 1: Digital Shepherd (Identity & Hierarchy)

### 1.1 Multi-Church Architecture
- [ ] Branch profiles (HQ + all local branches)
- [ ] Store: Branch name, location, lead pastor, contact info
- [ ] Role-based access: Super Admin (HQ) | Branch Admin (Local)

### 1.2 Comprehensive Member Directory
- [ ] Personal data: Name, Phone, DOB, Gender, Occupation
- [ ] Spiritual data: Salvation date, Baptism status (Maji & Roho Mtakatifu), Marriage status
- [ ] Family linking: Link households (spouses, children)

### 1.3 Zone & Cell Group (Jumuiya) Management
- [ ] Assign members to Zones/Jumuiyas by residence
- [ ] Designate group leaders
- [ ] Track leader-to-member responsibility

### 1.4 First-Time Visitor (Wageni) Pipeline
- [ ] Visitor entry form (Sunday intake)
- [ ] Follow-up tracking: Called | Visited | Converted | Dropped

---

## Phase 2: Ministry Operations (Engagement & Care)

### 2.1 Attendance & Service Management
- [ ] Define service types (Sunday, Mid-week, All-night prayers)
- [ ] Headcount tracking (Men, Women, Children, Visitors)
- [ ] Optional: Individual check-in for leaders/workers

### 2.2 Pastoral Care & Visitation Tracking
- [ ] Visitation logs (Date, Reason, Notes)
- [ ] Red flags dashboard (No visit in 3+ months, Inactive Jumuiya)

### 2.3 Communication Hub (SMS)
- [ ] Bulk SMS by group (Choir, Jumuiya Leaders, etc.)
- [ ] Automated birthday SMS

### 2.4 Department/Ministry Management
- [ ] Create ministries (Choir, Ushers, Intercessors)
- [ ] Assign members to departments
- [ ] Track workforce across branches

---

## Phase 3: Stewardship & Resources (Finance & Assets)

### 3.1 Financial Management
- [ ] Revenue tracking (Tithes, Offerings, Thanksgiving, First Fruits)
- [ ] Pledge tracking (Ahadi - building/project funds)
- [ ] Expense recording (Bills, Salaries, Ministry costs)
- [ ] Cash reconciliation vs. mobile money

### 3.2 Asset & Inventory Management
- [ ] Asset registry (Instruments, Generators, Furniture, Vehicles)
- [ ] Custody assignment by branch
- [ ] Maintenance/condition logging

### 3.3 Calendar & Event Planning
- [ ] Shared HQ calendar (Camp meetings, Seminars)
- [ ] Branch-specific calendars

---

## Technical Architecture

### Database Strategy
- Every entity must have `church_id` foreign key
- Examples: Member, Attendance, Department, Service, VisitationLog
- Enforce multi-tenancy at schema level

### Backend (NestJS)
- [ ] Church context middleware on all requests
- [ ] Permission guards: HQ vs. Branch Admin
- [ ] Filtering logic: Super Admin (optional church_id) | Branch Admin (mandatory church_id)

### Frontend (Next.js)
- [ ] Church context selector in top nav (HQ users only)
- [ ] Default view based on logged-in user's role
- [ ] Dynamic filtering of all data views

---

## Database Schema (Phase 1 Priority)
- Church
- Member
- Family (links to members)
- Zone / Jumuiya
- User (with role & church assignment)
- Visitor (Wageni tracking)

---

## Success Metrics (Phase 1)
✓ All members and branches mapped in system
✓ HQ has complete visibility; Branch admins see only their branch
✓ Visitor follow-up system operational
✓ Staff comfortable using system as "ministry tool"
