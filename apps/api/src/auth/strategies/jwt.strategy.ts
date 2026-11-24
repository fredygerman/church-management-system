import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
import { eq, isNull } from 'drizzle-orm';
import config from '../../config';
import { users } from '@church/db';
import { Database } from '../../database/interfaces/database.interfaces';

export interface JwtPayload {
  sub: string; // user id
  type?: string;
  email?: string;
  phone?: string;
  role?: string;
  churchId?: string | null;
  activeChurchId?: string | null;
  activeMembershipId?: string | null;
  activeRole?: string;
  assignedZoneId?: string | null;
  tv?: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') implements OnModuleInit {
  private db: Database;

  constructor(private readonly databaseService: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  async validate(payload: JwtPayload) {
    // Refresh tokens are signed with the same secret; only POST /auth/refresh may use them.
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used as access tokens');
    }

    const [user] = await this.db
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

    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      ...user,
      role: payload.activeRole ?? payload.role ?? user.role,
      churchId: payload.activeChurchId ?? payload.churchId ?? user.churchId,
      activeChurchId: payload.activeChurchId ?? payload.churchId ?? user.churchId,
      activeMembershipId: payload.activeMembershipId ?? null,
      assignedZoneId: payload.assignedZoneId ?? user.assignedZoneId,
    };
  }
}
