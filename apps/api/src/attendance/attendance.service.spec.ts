import { AttendanceService } from './attendance.service'

// Raw shape of a single check-in row before any department join is applied.
const CHECKIN_ROW_BASE = {
  sessionId: 'session-1',
  memberId: 'member-1',
  sessionDate: '2026-01-05',
  gender: 'female',
  dateOfBirth: '1990-01-01',
  zoneId: 'zone-1',
  zoneName: 'Zone A',
}

// Member "member-1" belongs to two departments (Choir, Ushers) and checked into
// one session. A real department join fans this single check-in out into one
// row per department.
const DEPARTMENT_FANNED_ROWS = [
  { ...CHECKIN_ROW_BASE, departmentId: 'dept-choir', departmentName: 'Choir' },
  { ...CHECKIN_ROW_BASE, departmentId: 'dept-ushers', departmentName: 'Ushers' },
]

jest.mock('@church/db', () => {
  const actual = jest.requireActual('@church/db')
  const chain: any = {
    from: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    where: () => Promise.resolve(chain.__rows),
  }
  return {
    ...actual,
    db: {
      // The service uses a different select column shape depending on groupBy:
      // only the 'department' branch requests departmentId. Mirror that here to
      // simulate the real join fan-out only when it actually happens.
      select: (columns: Record<string, unknown>) => {
        chain.__rows = 'departmentId' in columns ? DEPARTMENT_FANNED_ROWS : [CHECKIN_ROW_BASE]
        return chain
      },
    },
  }
})

describe('AttendanceService', () => {
  let service: AttendanceService

  beforeEach(() => {
    service = new AttendanceService()
  })

  it('fans a member out across every department bucket they belong to', async () => {
    const result = await service.getTrends('church-1', {
      from: '2026-01-01',
      to: '2026-01-31',
      groupBy: 'department',
    })

    const byGroup = new Map(result.map((row) => [row.group, row]))
    expect(byGroup.get('Choir')?.totalCheckins).toBe(1)
    expect(byGroup.get('Ushers')?.totalCheckins).toBe(1)

    // Sum across buckets exceeds the member's real single check-in - expected
    // fan-out, not a bug.
    const summedAcrossBuckets = result.reduce((sum, row) => sum + row.totalCheckins, 0)
    expect(summedAcrossBuckets).toBe(2)
  })

  it('does not leak department fan-out into other groupBy modes', async () => {
    const result = await service.getTrends('church-1', {
      from: '2026-01-01',
      to: '2026-01-31',
      groupBy: 'gender',
    })

    expect(result).toHaveLength(1)
    expect(result[0].group).toBe('female')
    expect(result[0].totalCheckins).toBe(1)
    expect(result[0].uniqueMembers).toBe(1)
  })
})
