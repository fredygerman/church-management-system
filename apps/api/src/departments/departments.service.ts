import { Injectable } from '@nestjs/common'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { db } from '@church/db'
import { departments, memberDepartments, members, Department } from '@church/db'

export type CreateDepartmentInput = {
  churchId: string
  name: string
  description?: string
  meetingDay?: string
}

@Injectable()
export class DepartmentsService {
  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentInput): Promise<Department> {
    const [department] = await db.insert(departments).values(data).returning()
    return department
  }

  /**
   * Get all departments in a church, optionally filtered to a set of led department ids
   * (used for `department_leader` scoping). `ledDepartmentIds === undefined` means no filter;
   * an empty array means "no led departments" and must return zero rows.
   */
  async getDepartmentsByChurch(churchId: string, ledDepartmentIds?: string[]): Promise<Department[]> {
    if (ledDepartmentIds && ledDepartmentIds.length === 0) {
      return []
    }

    return db.query.departments.findMany({
      where: and(
        eq(departments.churchId, churchId),
        isNull(departments.deletedAt),
        ...(ledDepartmentIds ? [inArray(departments.id, ledDepartmentIds)] : []),
      ),
    })
  }

  /**
   * Get the department ids led by a member (isLeader = true), scoped to a church.
   */
  async getLedDepartmentIds(churchId: string, memberId: string): Promise<string[]> {
    const rows = await db.query.memberDepartments.findMany({
      where: and(
        eq(memberDepartments.memberId, memberId),
        eq(memberDepartments.isLeader, true),
        eq(memberDepartments.churchId, churchId),
      ),
    })
    return rows.map((row) => row.departmentId)
  }

  /**
   * Get a single department by ID, scoped to a church
   */
  async getDepartmentByIdInChurch(churchId: string, departmentId: string): Promise<Department | undefined> {
    const [department] = await db.query.departments.findMany({
      where: and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)),
      limit: 1,
    })
    return department
  }

  /**
   * Update department details
   */
  async updateDepartment(churchId: string, departmentId: string, data: Partial<CreateDepartmentInput>): Promise<Department> {
    const [updatedDepartment] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)))
      .returning()
    return updatedDepartment
  }

  /**
   * Soft delete department
   */
  async deleteDepartment(churchId: string, departmentId: string): Promise<void> {
    await db
      .update(departments)
      .set({ deletedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)))
  }

  /**
   * Get members in a department
   */
  async getDepartmentMembers(churchId: string, departmentId: string): Promise<any[]> {
    // Use a join query instead of relational query to avoid relation issues
    const result = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        dateOfBirth: members.dateOfBirth,
        gender: members.gender,
        occupation: members.occupation,
        dateOfSalvation: members.dateOfSalvation,
        baptismStatus: members.baptismStatus,
        maritalStatus: members.maritalStatus,
        familyId: members.familyId,
        notes: members.notes,
        churchId: members.churchId,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
        deletedAt: members.deletedAt,
        isLeader: memberDepartments.isLeader,
      })
      .from(memberDepartments)
      .innerJoin(departments, eq(memberDepartments.departmentId, departments.id))
      .innerJoin(members, eq(memberDepartments.memberId, members.id))
      .where(and(
        eq(memberDepartments.departmentId, departmentId),
        eq(departments.churchId, churchId),
        isNull(members.deletedAt)
      ))

    return result
  }

  /**
   * Assign a member to a department (upsert - allows flipping isLeader on an existing row)
   */
  async assignMemberToDepartment(churchId: string, departmentId: string, memberId: string, isLeader: boolean = false): Promise<any> {
    const [department] = await db.query.departments.findMany({
      where: and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)),
      limit: 1,
    })
    const [member] = await db.query.members.findMany({
      where: and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)),
      limit: 1,
    })
    if (!department || !member) {
      throw new Error('Department or member not found in church context')
    }

    // Use insert with onConflict to handle upsert
    const [assignment] = await db
      .insert(memberDepartments)
      .values({ churchId, departmentId, memberId, isLeader })
      .onConflictDoUpdate({
        target: [memberDepartments.memberId, memberDepartments.departmentId],
        set: { churchId, isLeader },
      })
      .returning()

    return assignment
  }

  /**
   * Remove a member from a department (hard delete of the junction row)
   */
  async removeMemberFromDepartment(churchId: string, departmentId: string, memberId: string): Promise<void> {
    const [department] = await db.query.departments.findMany({
      where: and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)),
      limit: 1,
    })
    if (!department) {
      throw new Error('Department not found in church context')
    }

    await db
      .delete(memberDepartments)
      .where(and(
        eq(memberDepartments.departmentId, departmentId),
        eq(memberDepartments.memberId, memberId),
      ))
  }

  /**
   * Add a leader to a department. The member must already be assigned to the department -
   * there is no cross-table leaderId to sync, leadership lives only on the junction row.
   */
  async addLeader(churchId: string, departmentId: string, memberId: string): Promise<any> {
    const [department] = await db.query.departments.findMany({
      where: and(eq(departments.id, departmentId), eq(departments.churchId, churchId), isNull(departments.deletedAt)),
      limit: 1,
    })
    if (!department) {
      throw new Error('Department not found in church context')
    }

    const [updated] = await db
      .update(memberDepartments)
      .set({ isLeader: true, updatedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(
        eq(memberDepartments.departmentId, departmentId),
        eq(memberDepartments.memberId, memberId),
        eq(memberDepartments.churchId, churchId),
      ))
      .returning()

    if (!updated) {
      throw new Error('Member must be assigned to the department before being made a leader')
    }

    return updated
  }

  /**
   * Remove a leader from a department (unsets isLeader, does not delete the row).
   * No guard against removing the last leader - there is no "must have a leader" invariant here.
   */
  async removeLeader(churchId: string, departmentId: string, memberId: string): Promise<any> {
    const [updated] = await db
      .update(memberDepartments)
      .set({ isLeader: false, updatedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(
        eq(memberDepartments.departmentId, departmentId),
        eq(memberDepartments.memberId, memberId),
        eq(memberDepartments.churchId, churchId),
      ))
      .returning()
    return updated
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(churchId: string, departmentId: string): Promise<any> {
    const departmentMembers = await this.getDepartmentMembers(churchId, departmentId)

    const totalMembers = departmentMembers.length
    const leaders = departmentMembers.filter((m) => m.isLeader).length
    const regularMembers = totalMembers - leaders

    return {
      totalMembers,
      leaders,
      regularMembers,
    }
  }
}
