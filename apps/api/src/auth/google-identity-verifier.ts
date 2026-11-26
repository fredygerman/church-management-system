import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

export interface VerifiedGoogleIdentity {
  subject: string
  email: string
  name: string
  picture?: string
}

interface GoogleTokenInfo {
  iss?: string
  aud?: string
  exp?: string
  sub?: string
  email?: string
  email_verified?: string | boolean
  name?: string
  picture?: string
}

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com'])

@Injectable()
export class GoogleIdentityVerifier {
  async verify(idToken: unknown): Promise<VerifiedGoogleIdentity> {
    if (typeof idToken !== 'string' || !idToken.trim()) {
      throw new UnauthorizedException('Invalid Google identity proof')
    }

    const audience = process.env.GOOGLE_CLIENT_ID?.trim()
    if (!audience) {
      throw new ServiceUnavailableException('Google OAuth is not configured')
    }

    let response: Response
    try {
      response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' },
      )
    } catch {
      throw new UnauthorizedException('Invalid Google identity proof')
    }

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google identity proof')
    }

    let token: GoogleTokenInfo
    try {
      token = (await response.json()) as GoogleTokenInfo
    } catch {
      throw new UnauthorizedException('Invalid Google identity proof')
    }

    const expiresAt = Number(token.exp)
    const verifiedEmail = token.email_verified === true || token.email_verified === 'true'
    if (
      !token.sub ||
      !token.email ||
      !token.name ||
      !GOOGLE_ISSUERS.has(token.iss ?? '') ||
      token.aud !== audience ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000) ||
      !verifiedEmail
    ) {
      throw new UnauthorizedException('Invalid Google identity proof')
    }

    return {
      subject: token.sub,
      email: token.email.trim().toLowerCase(),
      name: token.name.trim(),
      ...(token.picture ? { picture: token.picture } : {}),
    }
  }
}
