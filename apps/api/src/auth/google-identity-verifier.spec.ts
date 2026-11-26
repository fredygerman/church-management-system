import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { GoogleIdentityVerifier } from './google-identity-verifier'

describe('GoogleIdentityVerifier', () => {
  const previousAudience = process.env.GOOGLE_CLIENT_ID
  const realFetch = global.fetch

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id'
  })

  afterEach(() => {
    global.fetch = realFetch
    if (previousAudience === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = previousAudience
  })

  it('rejects provider responses with the wrong audience or unverified email', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          iss: 'https://accounts.google.com',
          aud: 'another-client',
          exp: String(Math.floor(Date.now() / 1000) + 60),
          sub: 'google-subject',
          email: 'user@example.com',
          email_verified: 'false',
          name: 'User',
        }),
        { status: 200 },
      ),
    ) as typeof fetch

    await expect(new GoogleIdentityVerifier().verify('not-a-profile-assertion')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('requires runtime provider configuration', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    await expect(new GoogleIdentityVerifier().verify('id-token')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })

  it('returns only verified provider identity fields', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          iss: 'accounts.google.com',
          aud: 'google-client-id',
          exp: String(Math.floor(Date.now() / 1000) + 60),
          sub: 'google-subject',
          email: ' User@Example.com ',
          email_verified: true,
          name: 'User',
          picture: 'https://example.com/user.png',
          extra: 'not returned',
        }),
        { status: 200 },
      ),
    ) as typeof fetch

    await expect(new GoogleIdentityVerifier().verify('id-token')).resolves.toEqual({
      subject: 'google-subject',
      email: 'user@example.com',
      name: 'User',
      picture: 'https://example.com/user.png',
    })
  })
})
