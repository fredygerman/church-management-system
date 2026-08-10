import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import {
  users,
  type User,
  userChurchMemberships,
  userChurchMembershipRoleEvents,
  type RoleType,
} from '../database/schema';
import { eq, and, ne, isNull } from 'drizzle-orm';
import { Database } from '../database/interfaces/database.interfaces';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private db: Database;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileUploadService: FileUploadService,
  ) {
    this.logger.log('Users service initialized');
  }

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  /**
   * Get user account details
   */
  async getAccount(userId: string): Promise<User> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Retrieved account details for user: ${userId}`);
    return user;
  }

  /**
   * Update user account details (name, email, picture)
   */
  async updateAccount(
    userId: string,
    dto: {
      name?: string;
      email?: string;
      picture?: string;
    },
  ): Promise<{ success: boolean; user: User; message: string }> {
    // Get current user
    const [currentUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate email
    if (dto.email && dto.email !== currentUser.email) {
      const existing = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, dto.email),
            ne(users.id, userId),
            isNull(users.deletedAt),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException('Email already registered');
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.picture !== undefined) updateData.picture = dto.picture;

    // Update user in database
    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    this.logger.log(`Updated account details for user: ${userId}`);

    return {
      success: true,
      user: updatedUser,
      message: 'Account updated successfully',
    };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    return user || null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return user || null;
  }

  /**
   * List users for a church
   */
  async listUsers(
    churchId: string,
    filters?: {
      role?: string;
      zoneId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ users: any[]; total: number }> {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const conditions: any[] = [
      eq(userChurchMemberships.churchId, churchId),
      isNull(userChurchMemberships.deletedAt),
      isNull(users.deletedAt),
    ];

    if (filters?.role) {
      conditions.push(eq(userChurchMemberships.role, filters.role as any));
    }

    if (filters?.zoneId) {
      conditions.push(eq(userChurchMemberships.assignedZoneId, filters.zoneId));
    }

    const result = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        picture: users.picture,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deletedAt: users.deletedAt,
        membershipId: userChurchMemberships.id,
        churchId: userChurchMemberships.churchId,
        memberId: userChurchMemberships.memberId,
        role: userChurchMemberships.role,
        assignedZoneId: userChurchMemberships.assignedZoneId,
        membershipStatus: userChurchMemberships.status,
        isDefaultChurch: userChurchMemberships.isDefaultChurch,
      })
      .from(userChurchMemberships)
      .innerJoin(users, eq(userChurchMemberships.userId, users.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await this.db
      .select({ id: userChurchMemberships.id })
      .from(userChurchMemberships)
      .innerJoin(users, eq(userChurchMemberships.userId, users.id))
      .where(and(...conditions));

    return {
      users: result,
      total: countResult.length,
    };
  }

  async updateMembershipRole(
    userId: string,
    churchId: string,
    nextRole: RoleType,
    changedBy: string,
    reason?: string,
  ) {
    const [membership] = await this.db
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

    if (!membership) {
      throw new NotFoundException('Membership not found for this church');
    }

    const previousRole = membership.role;

    const [updatedMembership] = await this.db
      .update(userChurchMemberships)
      .set({
        role: nextRole,
        updatedAt: new Date(),
      })
      .where(eq(userChurchMemberships.id, membership.id))
      .returning();

    await this.db.insert(userChurchMembershipRoleEvents).values({
      membershipId: membership.id,
      userId,
      churchId,
      previousRole,
      nextRole,
      changedBy,
      reason: reason || null,
    });

    await this.db
      .update(users)
      .set({ role: nextRole })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)));

    return updatedMembership;
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId: string, churchId: string): Promise<void> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Soft deleted user: ${userId}`);
  }

  /**
   * Restore soft deleted user
   */
  async restoreUser(userId: string, churchId: string): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: null })
      .where(and(eq(users.id, userId), eq(users.churchId, churchId)))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Restored user: ${userId}`);
    return user;
  }
}
