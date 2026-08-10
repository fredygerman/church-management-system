import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { DepartmentContextGuard } from './department-context.guard'
import { UserRole } from '../types/permission.types'

describe('DepartmentContextGuard', () => {
  const buildContext = (request: any) => ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any

  const buildRequest = (overrides: any = {}) => ({
    user: { id: 'user-1', role: UserRole.DEPARTMENT_LEADER },
    churchId: 'church-1',
    params: {},
    query: {},
    body: {},
    ...overrides,
  })

  let membersService: { getMemberByUserId: jest.Mock }
  let departmentsService: { getLedDepartmentIds: jest.Mock }
  let reflector: Reflector
  let guard: DepartmentContextGuard

  beforeEach(() => {
    membersService = { getMemberByUserId: jest.fn().mockResolvedValue({ id: 'member-1' }) }
    departmentsService = { getLedDepartmentIds: jest.fn() }
    reflector = new Reflector()
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    guard = new DepartmentContextGuard(
      reflector,
      membersService as any,
      departmentsService as any,
    )
  })

  it('auto-injects the single led department when no id is requested', async () => {
    departmentsService.getLedDepartmentIds.mockResolvedValue(['dept-1'])
    const request = buildRequest()

    const result = await guard.canActivate(buildContext(request))

    expect(result).toBe(true)
    expect(request.params.id).toBe('dept-1')
    expect(request.query.departmentId).toBe('dept-1')
  })

  it('passes through unmodified when leader has multiple led departments and no id is requested', async () => {
    departmentsService.getLedDepartmentIds.mockResolvedValue(['dept-1', 'dept-2'])
    const request = buildRequest()

    const result = await guard.canActivate(buildContext(request))

    expect(result).toBe(true)
    expect(request.params.id).toBeUndefined()
    expect(request.query.departmentId).toBeUndefined()
  })

  it('throws ForbiddenException when the requested department is not in the led set', async () => {
    departmentsService.getLedDepartmentIds.mockResolvedValue(['dept-1'])
    const request = buildRequest({ params: { id: 'dept-2' } })

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('passes through untouched for non-department_leader roles without resolving a member', async () => {
    const request = buildRequest({ user: { id: 'user-1', role: UserRole.ADMIN } })

    const result = await guard.canActivate(buildContext(request))

    expect(result).toBe(true)
    expect(membersService.getMemberByUserId).not.toHaveBeenCalled()
  })
})
