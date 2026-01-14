import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { users, type User } from '../database/schema';
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
  ): Promise<{ users: User[]; total: number }> {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const conditions: any[] = [
      eq(users.churchId, churchId),
      isNull(users.deletedAt),
    ];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }

    if (filters?.zoneId) {
      conditions.push(eq(users.assignedZoneId, filters.zoneId));
    }

    const result = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await this.db
      .select()
      .from(users)
      .where(and(eq(users.churchId, churchId), isNull(users.deletedAt)));

    return {
      users: result,
      total: countResult.length,
    };
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Soft deleted user: ${userId}`);
  }

  /**
   * Restore soft deleted user
   */
  async restoreUser(userId: string): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ deletedAt: null })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Restored user: ${userId}`);
    return user;
  }
}
