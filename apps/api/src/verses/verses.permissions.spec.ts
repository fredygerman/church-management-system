jest.mock('@church/db', () => ({ db: {}, verseEntries: {}, verseOverrides: {} }))

import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { UserRole } from '../auth/types/permission.types'
import { VersesController } from './verses.controller'
import type { VersesService } from './verses.service'

const guard = new PermissionGuard(new Reflector())

function callGuard(handlerName: keyof VersesController, role: string): boolean {
  const request = { churchId: 'church-a', user: { id: 'user-1', role, churchId: 'church-a' } }
  const context = {
    getHandler: () => VersesController.prototype[handlerName],
    getClass: () => VersesController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext
  return guard.canActivate(context)
}

function expectDenied(handlerName: keyof VersesController, role: string) {
  expect(() => callGuard(handlerName, role)).toThrow(ForbiddenException)
}

const MANAGE_ROUTES = ['createEntry', 'updateEntry', 'deleteEntry', 'setOverride', 'clearOverride'] as const
const VIEW_ROUTES = ['listEntries', 'listOverrides'] as const

describe('verses route permissions', () => {
  it('lets any signed-in member read today’s verse without a staff permission', () => {
    expect(callGuard('getToday', UserRole.MEMBER)).toBe(true)
    expect(callGuard('getToday', UserRole.USHER)).toBe(true)
  })

  it.each(MANAGE_ROUTES)('denies a member on the manage route %s', (route) => {
    expectDenied(route, UserRole.MEMBER)
  })

  it.each(VIEW_ROUTES)('denies a member on the view route %s', (route) => {
    expectDenied(route, UserRole.MEMBER)
  })

  it.each([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.PUBLISHER])(
    'lets %s manage and view verses',
    (role) => {
      for (const route of [...MANAGE_ROUTES, ...VIEW_ROUTES]) {
        expect(callGuard(route, role)).toBe(true)
      }
    },
  )

  it.each([UserRole.ZONE_LEADER, UserRole.DEPARTMENT_LEADER])(
    'lets %s view verses but not change them',
    (role) => {
      for (const route of VIEW_ROUTES) {
        expect(callGuard(route, role)).toBe(true)
      }
      for (const route of MANAGE_ROUTES) {
        expectDenied(route, role)
      }
    },
  )
})

describe('VersesController locale handling', () => {
  it('passes the parsed locale and the church from the request to the service', async () => {
    const service = { getTodayVerse: jest.fn().mockResolvedValue({ reference: 'Psalm 23:1' }) }
    const controller = new VersesController(service as unknown as VersesService)
    const request = { churchId: 'church-a', user: { id: 'user-1' } } as any

    await controller.getToday(request, 'fr')

    expect(service.getTodayVerse).toHaveBeenCalledWith('church-a', 'en')
  })
})
