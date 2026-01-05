import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
import { eq, isNull } from 'drizzle-orm';
import config from '../../config';
import { users } from '@church/db';

export interface JwtRefreshPayload {
  sub: string; // user id
  email?: string;
  phone?: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtRefreshPayload) {
    // Verify this is a refresh token
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      throw new UnauthorizedException('User account is deleted');
    }

    return user;
  }
}
