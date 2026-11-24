import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { and, asc, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import {
  users,
  refreshTokens,
  type User,
  churches,
  type Church,
  userChurchMemberships,
  type UserChurchMembership,
} from '../database/schema';
import { Database } from '../database/interfaces/database.interfaces';
import config from '../config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_TTL_SECONDS = 604800; // 7 days

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  // jti identifies the refresh_tokens row; fid is the family (one login) it belongs to.
  // Tokens issued before rotation lack both and are rejected on refresh.
  jti?: string;
  fid?: string;
  email?: string;
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

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'passwordHash'>;
}

export interface ActiveMembershipContext {
  id: string;
  churchId: string;
  role: string;
  assignedZoneId?: string | null;
  status: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private db: Database;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('Auth service initialized');
  }

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  private withoutPassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async registerWithPassword(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || password.length < 12) {
      throw new BadRequestException('Name, email, and a password of at least 12 characters are required');
    }

    const [existingUser] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existingUser) throw new ConflictException('Email already registered');

    const [user] = await this.db.insert(users).values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'member',
    }).returning();

    return this.authResponse(user);
  }

  async loginWithPassword(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(and(eq(users.email, email.trim().toLowerCase()), isNull(users.deletedAt))).limit(1);
    if (!user?.passwordHash || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authResponse(user);
  }

  private async authResponse(user: User): Promise<AuthResponse> {
    const membership = await this.getPreferredMembership(user.id, user.churchId);
    return { ...(await this.generateTokens(user, membership)), user: this.withoutPassword(user) };
  }

  /**
   * Generate JWT tokens (access and refresh). Each refresh token is recorded in
   * refresh_tokens. Without familyId (login, switch-church) a new family starts;
   * rotation passes the existing family so reuse can revoke all of it.
   */
  async generateTokens(
    user: any,
    membership?: ActiveMembershipContext | null,
    familyId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const activeChurchId = membership?.churchId ?? user.activeChurchId ?? user.churchId ?? null;
    const activeMembershipId = membership?.id ?? user.activeMembershipId ?? user.membershipId ?? null;
    const activeRole = membership?.role ?? user.activeRole ?? user.role ?? 'member';
    const assignedZoneId =
      membership?.assignedZoneId ?? user.assignedZoneId ?? null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: activeRole,
      churchId: activeChurchId,
      activeChurchId,
      activeMembershipId,
      activeRole,
      assignedZoneId,
      tv: user.tokenVersion ?? 0,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 3600, // 1 hour in seconds
    });

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh', jti, fid: familyId },
      {
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }
    );

    await this.db.insert(refreshTokens).values({
      id: jti,
      userId: user.id,
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: unknown): Promise<RefreshTokenPayload> {
    if (typeof token !== 'string' || !token.trim()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: config.jwt.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload || typeof payload.sub !== 'string' || payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    return payload;
  }

  async getPreferredMembership(userId: string, churchId?: string | null): Promise<ActiveMembershipContext | null> {
    const where = [
      eq(userChurchMemberships.userId, userId),
      eq(userChurchMemberships.status, 'active'),
      isNull(userChurchMemberships.deletedAt),
    ];

    if (churchId) {
      where.push(eq(userChurchMemberships.churchId, churchId));
    }

    const memberships = await this.db
      .select()
      .from(userChurchMemberships)
      .where(and(...where))
      .orderBy(desc(userChurchMemberships.isDefaultChurch), asc(userChurchMemberships.createdAt))
      .limit(churchId ? 1 : 20);

    if (churchId) {
      return this.toMembershipContext(memberships[0]);
    }

    const defaultMembership =
      memberships.find((membership) => membership.isDefaultChurch) ?? memberships[0];

    return this.toMembershipContext(defaultMembership);
  }

  async getUserMemberships(userId: string) {
    return this.db
      .select({
        id: userChurchMemberships.id,
        churchId: userChurchMemberships.churchId,
        memberId: userChurchMemberships.memberId,
        role: userChurchMemberships.role,
        assignedZoneId: userChurchMemberships.assignedZoneId,
        status: userChurchMemberships.status,
        isDefaultChurch: userChurchMemberships.isDefaultChurch,
        churchName: churches.name,
        churchLocation: churches.location,
      })
      .from(userChurchMemberships)
      .innerJoin(churches, eq(userChurchMemberships.churchId, churches.id))
      .where(
        and(
          eq(userChurchMemberships.userId, userId),
          isNull(userChurchMemberships.deletedAt),
          isNull(churches.deletedAt),
        )
      );
  }

  async listOwnMemberships(userId: string) {
    const memberships = await this.getUserMemberships(userId);
    return memberships
      .filter((membership) => membership.status !== 'suspended')
      .map(({ churchId, churchName, role, status }) => ({ churchId, churchName, role, status }));
  }

  async switchChurch(userId: string, churchId: string): Promise<AuthTokens> {
    const user = await this.getProfile(userId);
    const [rawMembership] = await this.db
      .select()
      .from(userChurchMemberships)
      .where(
        and(
          eq(userChurchMemberships.userId, userId),
          eq(userChurchMemberships.churchId, churchId),
          isNull(userChurchMemberships.deletedAt),
        )
      )
      .limit(1);

    if (!rawMembership) {
      throw new ForbiddenException('You do not have access to this church');
    }

    if (rawMembership.status !== 'active') {
      throw new ForbiddenException('Your membership in this church is not active');
    }

    const membership = this.toMembershipContext(rawMembership);
    return this.generateTokens(user, membership);
  }

  /**
   * Invalidate every token issued to a user (logout). Bumping tokenVersion
   * makes existing access and refresh tokens fail the version check; open
   * refresh_tokens rows are also marked used so they cannot rotate.
   */
  async revokeTokens(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
      .where(eq(users.id, userId));

    await this.db
      .update(refreshTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.usedAt)));
  }

  /**
   * Exchange a refresh token for a new access/refresh pair in the same family.
   *
   * The presented jti is consumed with a conditional UPDATE, so two concurrent
   * refreshes cannot both succeed. If the jti was already used, is unknown, or
   * has expired, the whole family is revoked and the request gets 401. A
   * replayed token therefore also kills the newer token issued from it.
   *
   * Pre-rotation refresh tokens (no jti/fid, no row) are rejected with 401, so
   * those users must sign in again once after this change ships.
   */
  async rotateRefreshToken(token: unknown): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(token);

    if (!payload.jti || !payload.fid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const now = new Date();
    const [consumed] = await this.db
      .update(refreshTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(refreshTokens.id, payload.jti),
          eq(refreshTokens.userId, payload.sub),
          isNull(refreshTokens.usedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .returning({ id: refreshTokens.id });

    if (!consumed) {
      await this.db
        .update(refreshTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(refreshTokens.familyId, payload.fid),
            eq(refreshTokens.userId, payload.sub),
            isNull(refreshTokens.usedAt),
          ),
        );
      this.logger.warn(`Refresh token reuse or expiry for user ${payload.sub}; family ${payload.fid} revoked`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.refreshTokensForPayload(payload, payload.fid);
  }

  async refreshTokensForPayload(payload: any, familyId: string): Promise<AuthTokens> {
    const user = await this.getProfile(payload.sub).catch((error) => {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw error;
    });

    if (user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const membership = await this.getPreferredMembership(
      user.id,
      payload.activeChurchId ?? payload.churchId ?? null,
    );

    return this.generateTokens(user, membership, familyId);
  }

  private toMembershipContext(
    membership?: UserChurchMembership,
  ): ActiveMembershipContext | null {
    if (!membership) {
      return null;
    }

    return {
      id: membership.id,
      churchId: membership.churchId,
      role: membership.role,
      assignedZoneId: membership.assignedZoneId,
      status: membership.status,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.withoutPassword(user);
  }

  /**
   * Refresh access token
   */
  async refreshToken(user: Omit<User, 'passwordHash'>): Promise<AuthTokens> {
    const membership = await this.getPreferredMembership(user.id, user.churchId);
    const tokens = await this.generateTokens(user, membership);
    this.logger.log(`Token refreshed for user: ${user.id}`);
    return tokens;
  }

  /**
   * OAuth login/signup - Creates or updates user and returns JWT tokens
   * Used by Google OAuth flow
   */
  async oauthLogin(
    email: string,
    name: string,
    picture?: string,
  ): Promise<{ user: Omit<User, 'passwordHash'> | null; isNewUser: boolean }> {
    // Check if user exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Update existing user with latest picture if provided
      if (picture && existingUser.picture !== picture) {
        await this.db
          .update(users)
          .set({ picture })
          .where(eq(users.id, existingUser.id));
      }
      return { user: this.withoutPassword(existingUser), isNewUser: false };
    }

    // Create new user from OAuth info
    const newUser = {
      name,
      email,
      picture: picture || null,
      role: 'member' as const,
    };

    const [createdUser] = await this.db
      .insert(users)
      .values(newUser)
      .returning();

    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }

    this.logger.log(`New OAuth user created: ${createdUser.id}`);
    return { user: this.withoutPassword(createdUser), isNewUser: true };
  }

  /**
   * Setup initial church and assign user as super_admin
   * Used during the first-time setup flow
   */
  async setupInitialChurch(
    userId: string,
    name: string,
    location: string,
    leadPastorName: string,
    options?: {
      phone?: string;
      email?: string;
      description?: string;
    }
  ): Promise<Church> {
    try {
      // Create the church
      const [church] = await this.db
        .insert(churches)
        .values({
          name,
          location,
          leadPastorName,
          phone: options?.phone || null,
          email: options?.email || null,
          description: options?.description || null,
        })
        .returning();

      if (!church) {
        throw new BadRequestException('Failed to create church');
      }

      // Update the user to assign them to this church as super_admin
      const [updatedUser] = await this.db
        .update(users)
        .set({
          churchId: church.id,
          role: 'super_admin' as const,
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new BadRequestException('Failed to assign user to church');
      }

      await this.db
        .insert(userChurchMemberships)
        .values({
          userId,
          churchId: church.id,
          role: 'super_admin' as const,
          status: 'active' as const,
          isDefaultChurch: true,
        })
        .onConflictDoNothing();

      this.logger.log(
        `Church setup completed: Church ${church.id} created and user ${userId} assigned as super_admin`
      );

      return church;
    } catch (error) {
      this.logger.error('Setup initial church error:', error);
      throw error;
    }
  }
}
