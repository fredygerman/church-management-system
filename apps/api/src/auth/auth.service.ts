import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { and, asc, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import {
  users,
  refreshTokens,
  type User,
  churches,
  type Church,
  userChurchMemberships,
  type UserChurchMembership,
  oauthProviderIdentities,
  passwordRecoveryTokens,
} from '../database/schema';
import { Database } from '../database/interfaces/database.interfaces';
import config from '../config';
import { isPlatformAdmin } from './platform-admin';
import type { VerifiedGoogleIdentity } from './google-identity-verifier';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_TTL_SECONDS = 604800; // 7 days
// A replay this soon after rotation is treated as a parallel refresh, not theft.
const REFRESH_REUSE_GRACE_MS = 10_000;
const PASSWORD_RECOVERY_TOKEN_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RECOVERY_RATE_LIMIT = 5;
const PASSWORD_RECOVERY_RATE_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RECOVERY_GENERIC_MESSAGE =
  'If an account exists, recovery instructions will be available through the configured delivery channel.';

// Root db or the transaction handle used during rotation.
type DbExecutor = Pick<Database, 'select' | 'insert' | 'update' | 'delete'>;

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
  private readonly recoveryRateLimits = new Map<string, { count: number; resetAt: number }>();

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
    db: DbExecutor = this.db,
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

    // Lazy cleanup: expired rows can never be presented again.
    await db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, user.id), lt(refreshTokens.expiresAt, new Date())));

    await db.insert(refreshTokens).values({
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

  async getPreferredMembership(
    userId: string,
    churchId?: string | null,
    db: DbExecutor = this.db,
  ): Promise<ActiveMembershipContext | null> {
    const where = [
      eq(userChurchMemberships.userId, userId),
      eq(userChurchMemberships.status, 'active'),
      isNull(userChurchMemberships.deletedAt),
    ];

    if (churchId) {
      where.push(eq(userChurchMemberships.churchId, churchId));
    }

    const memberships = await db
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
      .filter((membership) => membership.status === 'active')
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
   * refreshes cannot both succeed. The consume, the follow-up reads and the new
   * token insert share one transaction: a failure after the consume rolls it
   * back and the presented token stays usable.
   *
   * If the jti was already used, is unknown, or has expired, the family is
   * revoked and the request gets 401. Exception: a jti used less than
   * REFRESH_REUSE_GRACE_MS ago is a parallel refresh; it gets a distinct 401
   * and the family survives. The revoke runs outside the transaction so it
   * persists.
   *
   * Pre-rotation refresh tokens (no jti/fid, no row) are rejected with 401, so
   * those users must sign in again once after this change ships.
   */
  async rotateRefreshToken(token: unknown): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(token);

    if (!payload.jti || !payload.fid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const jti = payload.jti;
    const familyId = payload.fid;
    const userId = payload.sub;
    const now = new Date();
    const rotated = await this.db.transaction(async (tx) => {
      const [consumed] = await tx
        .update(refreshTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(refreshTokens.id, jti),
            eq(refreshTokens.userId, userId),
            isNull(refreshTokens.usedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        )
        .returning({ id: refreshTokens.id });

      if (!consumed) return null;
      return this.refreshTokensForPayload(payload, familyId, tx);
    });

    if (rotated) return rotated;

    const [row] = await this.db
      .select({ usedAt: refreshTokens.usedAt, expiresAt: refreshTokens.expiresAt })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.id, jti), eq(refreshTokens.userId, userId)))
      .limit(1);

    if (row?.usedAt && row.expiresAt > now && Math.abs(now.getTime() - row.usedAt.getTime()) <= REFRESH_REUSE_GRACE_MS) {
      throw new UnauthorizedException('Refresh already in progress');
    }

    await this.db
      .update(refreshTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.usedAt),
        ),
      );
    this.logger.warn(`Refresh token reuse or expiry for user ${userId}; family ${familyId} revoked`);
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  async refreshTokensForPayload(payload: any, familyId: string, db: DbExecutor = this.db): Promise<AuthTokens> {
    const user = await this.getProfile(payload.sub, db).catch((error) => {
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
      db,
    );

    return this.generateTokens(user, membership, familyId, db);
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
  async getProfile(userId: string, db: DbExecutor = this.db): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await db
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
   * OAuth login/signup - Creates or updates a user from verified provider identity
   * Used by Google OAuth flow
   */
  async oauthLogin(
    identity: VerifiedGoogleIdentity,
  ): Promise<{ user: Omit<User, 'passwordHash'> | null; isNewUser: boolean }> {
    const provider = 'google';
    const email = identity.email.trim().toLowerCase();

    const [linkedIdentity] = await this.db
      .select()
      .from(oauthProviderIdentities)
      .where(
        and(
          eq(oauthProviderIdentities.provider, provider),
          eq(oauthProviderIdentities.providerSubject, identity.subject),
        ),
      )
      .limit(1);

    if (linkedIdentity) {
      const [mappedUser] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, linkedIdentity.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!mappedUser?.isActive || mappedUser.passwordHash) {
        throw new UnauthorizedException('Invalid Google identity proof');
      }

      if (identity.picture && mappedUser.picture !== identity.picture) {
        await this.db
          .update(users)
          .set({ picture: identity.picture })
          .where(eq(users.id, mappedUser.id));
      }
      return { user: this.withoutPassword(mappedUser), isNewUser: false };
    }

    // Check if user exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      if (existingUser.deletedAt || !existingUser.isActive) {
        throw new UnauthorizedException('Invalid Google identity proof');
      }

      // Password accounts need an explicit account-linking flow. A verified
      // provider email is sufficient for accounts created as passwordless OAuth
      // users, but must not silently link a password account.
      if (existingUser.passwordHash) {
        throw new UnauthorizedException('OAuth account is not linked');
      }

      // Update existing user with latest picture if provided
      if (identity.picture && existingUser.picture !== identity.picture) {
        await this.db
          .update(users)
          .set({ picture: identity.picture })
          .where(eq(users.id, existingUser.id));
      }
      await this.db
        .insert(oauthProviderIdentities)
        .values({ userId: existingUser.id, provider, providerSubject: identity.subject })
        .returning();
      return { user: this.withoutPassword(existingUser), isNewUser: false };
    }

    // Create new user from OAuth info
    const newUser = {
      name: identity.name,
      email,
      picture: identity.picture || null,
      role: 'member' as const,
    };

    const [createdUser] = await this.db
      .insert(users)
      .values(newUser)
      .returning();

    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }

    await this.db
      .insert(oauthProviderIdentities)
      .values({ userId: createdUser.id, provider, providerSubject: identity.subject })
      .returning();

    this.logger.log(`New OAuth user created: ${createdUser.id}`);
    return { user: this.withoutPassword(createdUser), isNewUser: true };
  }

  async requestPasswordRecovery(email: string, ipAddress = 'unknown') {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }

    this.assertPasswordRecoveryRateLimit(`ip:${ipAddress}`);
    this.assertPasswordRecoveryRateLimit(`email:${normalizedEmail}`);

    const genericResponse = { message: PASSWORD_RECOVERY_GENERIC_MESSAGE };
    if (process.env.PASSWORD_RECOVERY_DELIVERY_CONFIGURED !== 'true') {
      this.logger.log('Password recovery requested while delivery is not configured');
      return genericResponse;
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
      .limit(1);

    // OAuth-only and inactive accounts intentionally follow the same response
    // path as unknown accounts. Recovery never creates a password credential.
    if (!user?.isActive || !user.passwordHash) {
      this.logger.log('Password recovery request did not match a password account');
      return genericResponse;
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashRecoveryToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RECOVERY_TOKEN_TTL_MS);

    await this.db
      .delete(passwordRecoveryTokens)
      .where(and(eq(passwordRecoveryTokens.userId, user.id), lt(passwordRecoveryTokens.expiresAt, new Date())));
    await this.db
      .insert(passwordRecoveryTokens)
      .values({ userId: user.id, tokenHash, expiresAt })
      .returning();

    // DEC-05 keeps external sending disabled. A configured delivery capability
    // may consume this opaque URL later; the token is never returned or logged.
    const resetUrl = new URL('/auth/reset-password', config.frontendUrl);
    resetUrl.searchParams.set('token', rawToken);
    this.logger.log(`Password recovery flow prepared for configured delivery for user ${user.id}`);
    void resetUrl;
    return genericResponse;
  }

  async confirmPasswordRecovery(token: string, newPassword: string) {
    if (typeof token !== 'string' || !token.trim() || typeof newPassword !== 'string' || newPassword.length < 12) {
      throw new BadRequestException('A valid token and a password of at least 12 characters are required');
    }

    const now = new Date();
    const tokenHash = this.hashRecoveryToken(token);
    await this.db.transaction(async (tx) => {
      const [consumed] = await tx
        .update(passwordRecoveryTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(passwordRecoveryTokens.tokenHash, tokenHash),
            isNull(passwordRecoveryTokens.consumedAt),
            gt(passwordRecoveryTokens.expiresAt, now),
          ),
        )
        .returning({ userId: passwordRecoveryTokens.userId });

      if (!consumed) {
        throw new UnauthorizedException('Invalid or expired password reset token');
      }

      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, consumed.userId), isNull(users.deletedAt)))
        .limit(1);
      if (!user?.isActive || !user.passwordHash) {
        throw new UnauthorizedException('Invalid or expired password reset token');
      }

      await tx
        .update(users)
        .set({ passwordHash: await bcrypt.hash(newPassword, 12), tokenVersion: sql`${users.tokenVersion} + 1` })
        .where(eq(users.id, consumed.userId));
      await tx
        .update(refreshTokens)
        .set({ usedAt: now })
        .where(and(eq(refreshTokens.userId, consumed.userId), isNull(refreshTokens.usedAt)));
      await tx
        .update(passwordRecoveryTokens)
        .set({ consumedAt: now })
        .where(and(eq(passwordRecoveryTokens.userId, consumed.userId), isNull(passwordRecoveryTokens.consumedAt)));
    });

    return { message: 'Password reset successful' };
  }

  private hashRecoveryToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private assertPasswordRecoveryRateLimit(key: string): void {
    const now = Date.now();
    const current = this.recoveryRateLimits.get(key);
    if (!current || current.resetAt <= now) {
      this.recoveryRateLimits.set(key, {
        count: 1,
        resetAt: now + PASSWORD_RECOVERY_RATE_WINDOW_MS,
      });
      return;
    }

    if (current.count >= PASSWORD_RECOVERY_RATE_LIMIT) {
      throw new HttpException('Too many password recovery requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    current.count += 1;
  }

  /**
   * Setup initial church and assign user as church-scoped admin
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
      const church = await this.db.transaction(async (tx) => {
        const [createdChurch] = await tx
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

        if (!createdChurch) {
          throw new BadRequestException('Failed to create church');
        }

        // The setup owner is church-scoped. Platform-wide authority remains
        // derived from the server-side operator allowlist in isPlatformAdmin.
        const [updatedUser] = await tx
          .update(users)
          .set({
            churchId: createdChurch.id,
            role: 'admin' as const,
          })
          .where(and(eq(users.id, userId), isNull(users.churchId)))
          .returning({ id: users.id });

        if (!updatedUser) {
          throw new ConflictException('User already has a church assigned');
        }

        await tx
          .insert(userChurchMemberships)
          .values({
            userId,
            churchId: createdChurch.id,
            role: 'admin' as const,
            status: 'active' as const,
            isDefaultChurch: true,
          });

        return createdChurch;
      });

      this.logger.log(
        `Church setup completed: Church ${church.id} created and user ${userId} assigned as church admin`
      );

      return church;
    } catch (error) {
      this.logger.error('Setup initial church error:', error);
      throw error;
    }
  }

  isPlatformAdmin(user: { id?: string }): boolean {
    return isPlatformAdmin(user);
  }
}
