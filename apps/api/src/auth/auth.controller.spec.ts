// jest.config has no 'tsx' extension, so the React Email templates cannot be loaded here. Auth tests never send mail.
jest.mock('../mail/mail.service', () => ({ MailService: class MailService {} }))

import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { AuthController } from './auth.controller'

describe('AuthController security boundaries', () => {
  const oldIds = process.env.PLATFORM_ADMIN_USER_IDS

  afterEach(() => {
    if (oldIds === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS
    else process.env.PLATFORM_ADMIN_USER_IDS = oldIds
  })

  it('refuses setup to a non-trusted caller even when a stale token says super_admin', async () => {
    delete process.env.PLATFORM_ADMIN_USER_IDS
    const setupInitialChurch = jest.fn()
    const controller = new AuthController(
      {
        isPlatformAdmin: () => false,
        setupInitialChurch,
      } as any,
      {} as any,
    )

    await expect(
      controller.setupChurch(
        { id: 'caller', email: 'caller@example.com', role: 'super_admin', churchId: null },
        { name: 'Church', location: 'City', leadPastorName: 'Pastor' },
      ),
    ).rejects.toThrow(ForbiddenException)
    expect(setupInitialChurch).not.toHaveBeenCalled()
  })

  it('rejects the legacy profile-assertion OAuth body', async () => {
    const verify = jest.fn()
    const controller = new AuthController({} as any, { verify } as any)

    await expect(
      controller.oauthLogin({ email: 'attacker@example.com', name: 'Attacker' } as any),
    ).rejects.toThrow(/provider and idToken are required/)
    expect(verify).not.toHaveBeenCalled()
  })

  it('does not issue tokens when provider proof is rejected', async () => {
    const verify = jest.fn().mockRejectedValue(new UnauthorizedException('Invalid Google identity proof'))
    const generateTokens = jest.fn()
    const controller = new AuthController(
      { oauthLogin: jest.fn(), generateTokens } as any,
      { verify } as any,
    )

    await expect(controller.oauthLogin({ provider: 'google', idToken: 'foreign-token' })).rejects.toThrow(
      UnauthorizedException,
    )
    expect(generateTokens).not.toHaveBeenCalled()
  })
})
