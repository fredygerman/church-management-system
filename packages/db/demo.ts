import * as bcrypt from "bcrypt"
import { db, churches, users, userChurchMemberships, zones, departments, members, serviceTypes, serviceSessions, attendanceHeadcounts, attendanceCheckins, offeringCategories, offerings, events, visitors, prayerRequests } from "./index"

const id = { church: "11111111-1111-4111-8111-111111111111", admin: "22222222-2222-4222-8222-222222222222", service: "33333333-3333-4333-8333-333333333333", session: "44444444-4444-4444-8444-444444444444", tithe: "55555555-5555-4555-8555-555555555555" }
const email = process.env.DEMO_ADMIN_EMAIL
const password = process.env.DEMO_ADMIN_PASSWORD

if (process.env.DEMO_SEED_CONFIRM !== "true" || !email || !password || password.length < 12) throw new Error("Set DEMO_SEED_CONFIRM=true, DEMO_ADMIN_EMAIL, and a 12+ character DEMO_ADMIN_PASSWORD")

async function run() {
  const admin = { id: id.admin, name: "Demo Administrator", email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: "super_admin" as const, churchId: id.church, isActive: true }
  await db.insert(churches).values({ id: id.church, name: "Mito ya Baraka Church", location: "Dar es Salaam", leadPastorName: "Pastor Mito", description: "Demo church data" }).onConflictDoNothing()
  await db.insert(users).values(admin).onConflictDoUpdate({ target: users.id, set: admin })
  await db.insert(userChurchMemberships).values({ userId: id.admin, churchId: id.church, role: "super_admin", status: "active", isDefaultChurch: true }).onConflictDoNothing()
  const memberRows = Array.from({ length: 12 }, (_, i) => ({ id: `70000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`, churchId: id.church, firstName: ["Amina", "Baraka", "Clara", "Daniel"][i % 4], lastName: `Member ${i + 1}`, phone: `255700000${String(i + 1).padStart(3, "0")}`, gender: i % 2 ? "male" as const : "female" as const, maritalStatus: i % 3 ? "married" as const : "single" as const, baptismStatus: "both" as const }))
  await db.insert(zones).values(["Kariakoo", "Mikocheni", "Sinza"].map((name, i) => ({ id: `30000000-0000-4000-8000-00000000000${i + 1}`, churchId: id.church, name, description: `${name} fellowship zone` }))).onConflictDoNothing()
  await db.insert(departments).values(["Worship", "Youth", "Children"].map((name, i) => ({ id: `60000000-0000-4000-8000-00000000000${i + 1}`, churchId: id.church, name, description: `${name} ministry` }))).onConflictDoNothing()
  await db.insert(members).values(memberRows).onConflictDoNothing()
  await db.insert(serviceTypes).values({ id: id.service, churchId: id.church, name: "Sunday Celebration" }).onConflictDoNothing()
  await db.insert(serviceSessions).values({ id: id.session, churchId: id.church, serviceTypeId: id.service, title: "Sunday Celebration Demo", sessionDate: "2026-08-30", status: "closed", qrToken: "demo-sunday-celebration" }).onConflictDoNothing()
  await db.insert(attendanceHeadcounts).values({ churchId: id.church, sessionId: id.session, menCount: 34, womenCount: 51, childrenCount: 22, visitorsCount: 6, totalCount: 113 }).onConflictDoNothing()
  await db.insert(attendanceCheckins).values(memberRows.slice(0, 8).map((member) => ({ churchId: id.church, sessionId: id.session, memberId: member.id, source: "manual" as const }))).onConflictDoNothing()
  await db.insert(offeringCategories).values([{ id: id.tithe, churchId: id.church, name: "Tithe", description: "Regular tithe" }, { churchId: id.church, name: "Offering", description: "Sunday offering" }]).onConflictDoNothing()
  await db.insert(offerings).values(memberRows.slice(0, 4).map((member, i) => ({ churchId: id.church, categoryId: id.tithe, memberId: member.id, sessionId: id.session, amountCents: (i + 1) * 250000, currency: "TZ", offeringDate: "2026-08-30", showOnDonorWall: i === 0 }))).onConflictDoNothing()
  await db.insert(events).values({ churchId: id.church, title: "Community Outreach", description: "Demo community outreach event", location: "Kariakoo", startsAt: new Date("2026-09-15T09:00:00+03:00"), endsAt: new Date("2026-09-15T13:00:00+03:00"), status: "published", scope: "church" }).onConflictDoNothing()
  await db.insert(visitors).values({ churchId: id.church, firstName: "Neema", lastName: "Visitor", phone: "255711000001", email: "neema.visitor@example.test", visitorSource: "friend" }).onConflictDoNothing()
  await db.insert(prayerRequests).values({ churchId: id.church, userId: id.admin, memberId: memberRows[0].id, content: "Prayer for the upcoming outreach.", status: "open" }).onConflictDoNothing()
  console.log(`Demo ready for ${admin.email}`)
}
run().catch((error) => { console.error(error); process.exitCode = 1 })
