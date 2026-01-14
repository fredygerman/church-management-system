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
  email?: string;
  phone?: string;
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

    return user;
  }
}
