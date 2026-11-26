import { ForbiddenException } from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import 'reflect-metadata'

import { AttendanceController } from './attendance.controller'
import { AttendanceService } from './attendance.service'
import { PermissionGuard } from '../auth/guards/permission.guard'
import { db } from '@church/db'

jest.mock('@church/db', () => {
  const actual = jest.requireActual('@church/db')
  return {
    ...actual,
    db: {
      query: {
        serviceSessions: { findMany: jest.fn() },
        members: { findMany: jest.fn() },
      },
    },
  }
})

describe('native staff attendance check-in contract', () => {
  it('validates the member ID and accepts the injected church context', async () => {
    const bodyType = Reflect.getMetadata('design:paramtypes', AttendanceController.prototype, 'manualCheckin')[2]
    const valid = await validate(plainToInstance(bodyType, {
      memberId: '11111111-1111-4111-8111-111111111111',
      churchId: '22222222-2222-4222-8222-222222222222',
    }))
    const invalid = await validate(plainToInstance(bodyType, { memberId: 'not-a-uuid' }))

    expect(valid).toHaveLength(0)
    expect(invalid.some((error) => error.property === 'memberId')).toBe(true)
  })

  it('returns 403 when the caller lacks manage:attendance', () => {
    const guard = new PermissionGuard(new Reflector())
    const context = {
      getHandler: () => AttendanceController.prototype.manualCheckin,
      getClass: () => AttendanceController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1', role: 'zone_leader' },
        }),
      }),
    } as unknown as ExecutionContext

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
    try {
      guard.canActivate(context)
    } catch (error) {
      expect((error as ForbiddenException).getStatus()).toBe(403)
    }
  })

  it('returns 404 when the member belongs to another church', async () => {
    const query = (db as any).query
    query.serviceSessions.findMany.mockResolvedValueOnce([
      { id: 'session-1', churchId: 'church-a', status: 'open', deletedAt: null },
    ])
    query.members.findMany.mockResolvedValueOnce([])

    await expect(
      new AttendanceService().manualCheckin('church-a', 'session-1', 'member-from-church-b'),
    ).rejects.toMatchObject({ status: 404 })
  })
})
