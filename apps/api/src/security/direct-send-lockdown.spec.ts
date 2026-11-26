/**
 * RM-014 (D-18): direct SMS and email sends are platform-admin / SUPER_ADMIN only.
 * Church staff (ADMIN, BRANCH_ADMIN, ...) must get 403 even though they may hold manage:sms or manage:mail.
 */
jest.mock('../mail/mail.service', () => ({ MailService: class MailService {} }))
jest.mock('../sms/sms.service', () => ({ SmsService: class SmsService {} }))

import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SmsController } from '../sms/sms.controller'
import { MailController } from '../mail/mail.controller'
import { RoleGuard } from '../auth/guards/role.guard'

const ORIGINAL_ENV = { ...process.env }

function guardFor(handler: Function, cls: Function, user: Record<string, unknown>) {
  const guard = new RoleGuard(new Reflector())
  const context = {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
  return () => guard.canActivate(context)
}

describe('direct send lockdown (RM-014)', () => {
  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = 'platform-user'
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it.each([
    ['SmsController.sendSms', SmsController, SmsController.prototype.sendSms],
    ['SmsController.sendTestSms', SmsController, SmsController.prototype.sendTestSms],
    ['MailController.sendEmail', MailController, MailController.prototype.sendEmail],
  ])('%s requires super_admin', (_name, cls, handler) => {
    expect(Reflect.getMetadata('roles', handler)).toEqual(['super_admin'])
    expect(cls).toBeDefined()
  })

  it('denies a BRANCH_ADMIN (manage:sms holder) on /sms/send', () => {
    const run = guardFor(SmsController.prototype.sendSms, SmsController, { id: 'u1', role: 'branch_admin' })
    expect(run).toThrow(ForbiddenException)
  })

  it('denies an ADMIN on /mail/send', () => {
    const run = guardFor(MailController.prototype.sendEmail, MailController, { id: 'u2', role: 'admin' })
    expect(run).toThrow(ForbiddenException)
  })

  it('allows a SUPER_ADMIN on /sms/send', () => {
    const run = guardFor(SmsController.prototype.sendSms, SmsController, { id: 'u3', role: 'super_admin' })
    expect(run()).toBe(true)
  })

  it('allows a platform admin (server-side allow-list) regardless of church role', () => {
    const run = guardFor(MailController.prototype.sendEmail, MailController, { id: 'platform-user', role: 'member' })
    expect(run()).toBe(true)
  })
})
