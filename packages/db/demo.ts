import * as bcrypt from "bcrypt"
import {
  attendanceCheckins, attendanceHeadcounts, campaigns, churches, db, departments,
  eq, events, families, givingGoals, memberDepartments, members, memberZones,
  messageTemplates, offeringCategories, offerings, prayerRequests, serviceSessions,
  serviceTypes, userChurchMemberships, users, visitors, zones,
} from "./index"

const uid = (prefix: string, number: number) =>
  `${prefix}0000000-0000-4000-8000-${String(number).padStart(12, "0")}`

const CHURCH_ID = "11111111-1111-4111-8111-111111111111"
const ADMIN_ID = "22222222-2222-4222-8222-222222222222"
const email = process.env.DEMO_ADMIN_EMAIL
const password = process.env.DEMO_ADMIN_PASSWORD

if (process.env.DEMO_SEED_CONFIRM !== "true" || !email || !password || password.length < 12) {
  throw new Error("Set DEMO_SEED_CONFIRM=true, DEMO_ADMIN_EMAIL, and a 12+ character DEMO_ADMIN_PASSWORD")
}

const people = [
  ["Amina", "Mashauri", "female", "married", "Teacher"], ["Baraka", "Mashauri", "male", "married", "Civil Engineer"],
  ["Clara", "Mushi", "female", "single", "Accountant"], ["Daniel", "Mushi", "male", "single", "Software Developer"],
  ["Esther", "Mwakalinga", "female", "married", "Nurse"], ["Frank", "Mwakalinga", "male", "married", "Electrician"],
  ["Grace", "Lema", "female", "widowed", "Entrepreneur"], ["Hassan", "Lema", "male", "single", "University Student"],
  ["Irene", "Msuya", "female", "married", "Bank Officer"], ["Joseph", "Msuya", "male", "married", "Pastor"],
  ["Karen", "Mrema", "female", "single", "Graphic Designer"], ["Lucas", "Mrema", "male", "single", "Mechanic"],
  ["Mary", "Kweka", "female", "married", "Pharmacist"], ["Nehemia", "Kweka", "male", "married", "Business Owner"],
  ["Olivia", "Kimaro", "female", "single", "Lawyer"], ["Paul", "Kimaro", "male", "single", "Photographer"],
  ["Queen", "Mollel", "female", "married", "Social Worker"], ["Reuben", "Mollel", "male", "married", "Architect"],
  ["Sarah", "Magesa", "female", "single", "Journalist"], ["Thomas", "Magesa", "male", "single", "Driver"],
  ["Upendo", "Mfinanga", "female", "married", "Tailor"], ["Victor", "Mfinanga", "male", "married", "Police Officer"],
  ["Wema", "Mhando", "female", "single", "Nutritionist"], ["Yohana", "Mhando", "male", "single", "Carpenter"],
] as const

async function run() {
  const passwordHash = await bcrypt.hash(password, 12)
  const memberRows = people.map(([firstName, lastName, gender, maritalStatus, occupation], index) => ({
    id: uid("7", index + 1), churchId: CHURCH_ID, firstName, lastName,
    phone: `255710${String(index + 1).padStart(6, "0")}`,
    dateOfBirth: `${1980 + (index % 20)}-${String((index % 9) + 1).padStart(2, "0")}-15`,
    gender, maritalStatus, occupation, baptismStatus: index % 5 === 0 ? "maji" as const : "both" as const,
    dateOfSalvation: `${2005 + (index % 15)}-01-01`, notes: index < 3 ? "Zone and ministry leader" : "Active demo member",
  }))

  await db.transaction(async (tx) => {
    await tx.insert(churches).values({ id: CHURCH_ID, name: "Mito ya Baraka Church", location: "Dar es Salaam", leadPastorName: "Pastor Joseph Msuya", phone: "+255 22 277 2026", email: "info@mitoyabarakachurch.org", description: "A growing, community-focused church serving families across Dar es Salaam." }).onConflictDoUpdate({ target: churches.id, set: { leadPastorName: "Pastor Joseph Msuya", phone: "+255 22 277 2026", email: "info@mitoyabarakachurch.org" } })
    const admin = { id: ADMIN_ID, name: "Demo Administrator", email: email.toLowerCase(), passwordHash, role: "super_admin" as const, churchId: CHURCH_ID, isActive: true }
    await tx.insert(users).values(admin).onConflictDoUpdate({ target: users.id, set: admin })
    await tx.insert(userChurchMemberships).values({ userId: ADMIN_ID, churchId: CHURCH_ID, role: "super_admin", status: "active", isDefaultChurch: true }).onConflictDoNothing()
    for (const member of memberRows) await tx.insert(members).values(member).onConflictDoUpdate({ target: members.id, set: member })

    const zoneRows = [
      { id: uid("3", 1), churchId: CHURCH_ID, name: "Kariakoo", description: "Central city fellowship for Kariakoo and Ilala families.", meetingDay: "Wednesday", leaderId: memberRows[0].id },
      { id: uid("3", 2), churchId: CHURCH_ID, name: "Mikocheni", description: "Northern Dar es Salaam home fellowship and outreach zone.", meetingDay: "Thursday", leaderId: memberRows[8].id },
      { id: uid("3", 3), churchId: CHURCH_ID, name: "Sinza", description: "Youthful family fellowship serving Sinza and Ubungo.", meetingDay: "Friday", leaderId: memberRows[16].id },
    ]
    for (const zone of zoneRows) await tx.insert(zones).values(zone).onConflictDoUpdate({ target: zones.id, set: zone })
    for (const [index, member] of memberRows.entries()) {
      const zoneIndex = Math.floor(index / 8)
      await tx.insert(memberZones).values({ churchId: CHURCH_ID, memberId: member.id, zoneId: zoneRows[zoneIndex].id, isLeader: member.id === zoneRows[zoneIndex].leaderId }).onConflictDoUpdate({ target: [memberZones.memberId, memberZones.zoneId], set: { isLeader: member.id === zoneRows[zoneIndex].leaderId, deletedAt: null } })
    }

    const departmentRows = [
      { id: uid("6", 1), churchId: CHURCH_ID, name: "Worship", description: "Music, choir, sound, and Sunday worship ministry.", meetingDay: "Saturday" },
      { id: uid("6", 2), churchId: CHURCH_ID, name: "Youth", description: "Discipleship, mentoring, and activities for young adults.", meetingDay: "Friday" },
      { id: uid("6", 3), churchId: CHURCH_ID, name: "Children", description: "Sunday school and child-focused family ministry.", meetingDay: "Sunday" },
      { id: uid("6", 4), churchId: CHURCH_ID, name: "Hospitality", description: "Welcoming, ushering, and visitor care.", meetingDay: "Saturday" },
    ]
    for (const department of departmentRows) await tx.insert(departments).values(department).onConflictDoUpdate({ target: departments.id, set: department })
    for (const [index, member] of memberRows.entries()) {
      const departmentIndex = index % departmentRows.length
      await tx.insert(memberDepartments).values({ churchId: CHURCH_ID, memberId: member.id, departmentId: departmentRows[departmentIndex].id, isLeader: index === departmentIndex }).onConflictDoUpdate({ target: [memberDepartments.memberId, memberDepartments.departmentId], set: { isLeader: index === departmentIndex, deletedAt: null } })
    }

    const familyRows = [0, 4, 8, 12, 16, 20].map((memberIndex, index) => ({ id: uid("8", index + 1), churchId: CHURCH_ID, familyName: `${memberRows[memberIndex].lastName} Family`, parentId: memberRows[memberIndex].id, spouseId: memberRows[memberIndex + 1].id }))
    for (const family of familyRows) await tx.insert(families).values(family).onConflictDoUpdate({ target: families.id, set: family })
    for (const [familyIndex, family] of familyRows.entries()) {
      for (const memberIndex of [familyIndex * 4, familyIndex * 4 + 1]) await tx.update(members).set({ familyId: family.id }).where(eq(members.id, memberRows[memberIndex].id))
    }

    const serviceTypeRows = [
      { id: uid("4", 1), churchId: CHURCH_ID, name: "Sunday Celebration", isActive: true },
      { id: uid("4", 2), churchId: CHURCH_ID, name: "Midweek Prayer", isActive: true },
    ]
    for (const serviceType of serviceTypeRows) await tx.insert(serviceTypes).values(serviceType).onConflictDoUpdate({ target: serviceTypes.id, set: serviceType })
    const sessionRows = [[1, "2026-08-09", 91], [2, "2026-08-16", 104], [3, "2026-08-23", 108], [4, "2026-08-30", 113]].map(([number, sessionDate, total]) => ({ id: uid("5", Number(number)), churchId: CHURCH_ID, serviceTypeId: serviceTypeRows[0].id, title: `Sunday Celebration - ${sessionDate}`, sessionDate: String(sessionDate), status: "closed" as const, qrToken: `demo-sunday-${sessionDate}`, openedAt: String(sessionDate), closedAt: String(sessionDate), total: Number(total) }))
    for (const session of sessionRows) {
      const { total, ...row } = session
      await tx.insert(serviceSessions).values(row).onConflictDoUpdate({ target: serviceSessions.id, set: row })
      await tx.insert(attendanceHeadcounts).values({ id: uid("9", Number(session.id.slice(-12))), churchId: CHURCH_ID, sessionId: session.id, menCount: Math.round(total * 0.31), womenCount: Math.round(total * 0.44), childrenCount: Math.round(total * 0.2), visitorsCount: total - Math.round(total * 0.31) - Math.round(total * 0.44) - Math.round(total * 0.2), totalCount: total }).onConflictDoUpdate({ target: attendanceHeadcounts.sessionId, set: { totalCount: total, menCount: Math.round(total * 0.31), womenCount: Math.round(total * 0.44), childrenCount: Math.round(total * 0.2) } })
      for (const member of memberRows.slice(0, Math.min(8 + Number(session.id.slice(-1)) * 3, memberRows.length))) await tx.insert(attendanceCheckins).values({ churchId: CHURCH_ID, sessionId: session.id, memberId: member.id, source: "manual" }).onConflictDoNothing()
    }

    const categoryRows = [
      { id: uid("2", 1), churchId: CHURCH_ID, name: "Tithe", description: "Regular member tithes" },
      { id: uid("2", 2), churchId: CHURCH_ID, name: "Sunday Offering", description: "General Sunday service offering" },
      { id: uid("2", 3), churchId: CHURCH_ID, name: "Building Fund", description: "Sanctuary improvement contributions" },
    ]
    for (const category of categoryRows) await tx.insert(offeringCategories).values(category).onConflictDoUpdate({ target: offeringCategories.id, set: category })
    const goal = { id: uid("1", 1), churchId: CHURCH_ID, name: "Children's Ministry Classroom", description: "Equip a safe classroom with learning materials and furniture.", targetCents: 250000000, currency: "TZS", startDate: "2026-08-01", endDate: "2026-12-20", isPublic: true }
    await tx.insert(givingGoals).values(goal).onConflictDoUpdate({ target: givingGoals.id, set: goal })
    for (let index = 0; index < 18; index++) {
      const offering = { id: uid("a", index + 1), churchId: CHURCH_ID, categoryId: categoryRows[index % 3].id, memberId: memberRows[index % memberRows.length].id, sessionId: sessionRows[index % sessionRows.length].id, amountCents: 150000 + index * 50000, currency: "TZS", offeringDate: sessionRows[index % sessionRows.length].sessionDate, goalId: index % 3 === 2 ? goal.id : null, note: index % 3 === 2 ? "Classroom project contribution" : "Demo giving record", showOnDonorWall: index % 4 === 0 }
      await tx.insert(offerings).values(offering).onConflictDoUpdate({ target: offerings.id, set: offering })
    }

    const eventRows = [
      { id: uid("b", 1), churchId: CHURCH_ID, title: "Community Health Outreach", description: "Free basic health screening and family support.", location: "Kariakoo Community Hall", startsAt: new Date("2026-09-15T09:00:00+03:00"), endsAt: new Date("2026-09-15T14:00:00+03:00"), status: "published" as const, scope: "church" as const, headcount: 120 },
      { id: uid("b", 2), churchId: CHURCH_ID, title: "Youth Worship Night", description: "An evening of worship, testimonies, and fellowship.", location: "Main Sanctuary", startsAt: new Date("2026-09-25T18:00:00+03:00"), endsAt: new Date("2026-09-25T21:00:00+03:00"), status: "published" as const, scope: "church" as const, headcount: 80 },
      { id: uid("b", 3), churchId: CHURCH_ID, title: "Marriage Enrichment Seminar", description: "Practical teaching and conversation for married couples.", location: "Mikocheni Fellowship Centre", startsAt: new Date("2026-10-10T10:00:00+03:00"), endsAt: new Date("2026-10-10T15:00:00+03:00"), status: "draft" as const, scope: "church" as const, headcount: 50 },
    ]
    for (const event of eventRows) await tx.insert(events).values(event).onConflictDoUpdate({ target: events.id, set: event })
    for (let index = 0; index < 8; index++) {
      const visitor = { id: uid("c", index + 1), churchId: CHURCH_ID, firstName: ["Neema", "Zawadi", "Tumaini", "Rehema", "Kelvin", "Agnes", "Moses", "Diana"][index], lastName: "Visitor", phone: `255711100${String(index + 1).padStart(3, "0")}`, email: `visitor${index + 1}@example.test`, visitDate: `2026-08-${String(10 + index * 2).padStart(2, "0")}`, visitorSource: (["friend", "walk_in", "event", "social_media"] as const)[index % 4], referredByMemberId: memberRows[index].id }
      await tx.insert(visitors).values(visitor).onConflictDoUpdate({ target: visitors.id, set: visitor })
    }

    const template = { id: uid("d", 1), churchId: CHURCH_ID, name: "Sunday Service Reminder", channel: "sms" as const, body: "Habari {{firstName}}, tunakukaribisha kwenye ibada ya Jumapili saa 3:00 asubuhi.", variables: '["firstName"]', isActive: true, createdBy: ADMIN_ID }
    await tx.insert(messageTemplates).values(template).onConflictDoUpdate({ target: messageTemplates.id, set: template })
    const campaign = { id: uid("e", 1), churchId: CHURCH_ID, templateId: template.id, name: "September Service Reminder", channel: "sms" as const, body: template.body, audienceFilters: "{}", status: "draft" as const, createdBy: ADMIN_ID }
    await tx.insert(campaigns).values(campaign).onConflictDoUpdate({ target: campaigns.id, set: campaign })
    for (const [index, content] of ["Prayer for the upcoming community outreach.", "Prayer for students beginning a new school term.", "Thanksgiving for healing and family restoration.", "Prayer for wisdom for church and community leaders."].entries()) {
      const prayer = { id: uid("f", index + 1), churchId: CHURCH_ID, userId: ADMIN_ID, memberId: memberRows[index].id, content, status: index === 2 ? "answered" as const : "open" as const }
      await tx.insert(prayerRequests).values(prayer).onConflictDoUpdate({ target: prayerRequests.id, set: prayer })
    }
  })

  console.log(`Demo ready for ${email.toLowerCase()}: 24 members, populated zones and departments, families, attendance history, giving, events, visitors, communications, and prayer requests.`)
}

run().catch((error) => { console.error(error); process.exitCode = 1 })
