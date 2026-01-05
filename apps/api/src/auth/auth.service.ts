import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { eq } from 'drizzle-orm';
import { users, type User, churches, type Church } from '../database/schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('Auth service initialized');
  }

  /**
   * Generate JWT tokens (access and refresh)
   */
  generateTokens(user: any): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      churchId: user.churchId,
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

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const [user] = await this.db
      .getDb()
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
    const tokens = this.generateTokens(user);
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
      .getDb()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Update existing user with latest picture if provided
      if (picture && existingUser.picture !== picture) {
        await this.db
          .getDb()
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
      .getDb()
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
        .getDb()
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
        .getDb()
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
