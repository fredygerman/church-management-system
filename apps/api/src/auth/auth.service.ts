import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import {
  users,
  type User,
  churches,
  type Church,
  userChurchMemberships,
  type UserChurchMembership,
} from '../database/schema';
import { Database } from '../database/interfaces/database.interfaces';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'password'>;
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

  /**
   * Generate JWT tokens (access and refresh)
   */
  generateTokens(user: any, membership?: ActiveMembershipContext | null): AuthTokens {
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
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: 3600, // 1 hour in seconds
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: 604800, // 7 days in seconds
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token);
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

  async refreshTokensForPayload(payload: any): Promise<AuthTokens> {
    const user = await this.getProfile(payload.sub);
    const membership = await this.getPreferredMembership(
      user.id,
      payload.activeChurchId ?? payload.churchId ?? null,
    );

    return this.generateTokens(user, membership);
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
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(user: Omit<User, 'password'>): Promise<AuthTokens> {
    const membership = await this.getPreferredMembership(user.id, user.churchId);
    const tokens = this.generateTokens(user, membership);
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
  ): Promise<{ user: Omit<User, 'password'> | null; isNewUser: boolean }> {
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
      return { user: existingUser, isNewUser: false };
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
    return { user: createdUser, isNewUser: true };
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
