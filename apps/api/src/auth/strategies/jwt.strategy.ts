import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
import { eq, isNull } from 'drizzle-orm';
import config from '../../config';
import { users } from '@church/db';

export interface JwtPayload {
  sub: string; // user id
  email?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
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
