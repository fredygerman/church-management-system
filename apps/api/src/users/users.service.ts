import { randomUUID } from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../database/interfaces/database.interfaces';
import {
  AVATAR_ERROR_CODES,
  AVATAR_MAX_BYTES,
  AVATAR_SIGNED_GET_TTL_SECONDS,
  buildAvatarKey,
  detectAvatarImageType,
  stripImageMetadata,
} from './avatar-image';

/** The account as returned to clients: the raw storage key is replaced by a signed URL. */
export type AccountView = Omit<User, 'avatarKey'> & { avatarUrl: string | null };

/** Multer in-memory file, as delivered by FileInterceptor('file'). */
export interface AvatarUploadFile {
  buffer?: Buffer;
  size?: number;
  mimetype?: string;
}

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

    // Email is read-only until a verified change flow exists (RM-033, D-29).
    // An unchanged email is ignored; a different one is refused so no
    // unverified address can be attached to the account.
    if (
      dto.email !== undefined &&
      dto.email.trim().toLowerCase() !== currentUser.email.toLowerCase()
    ) {
      throw new BadRequestException({
        message: 'Email change requires verification',
        code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION',
      });
    }

    // Build update object (only include provided fields; email is never written here)
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
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
   * Client-facing account: drops the raw avatar key and adds a 15-minute signed
   * GET URL (null when no avatar is set or the URL cannot be signed).
   */
  async toAccountView(user: User): Promise<AccountView> {
    const { avatarKey, ...rest } = user;
    return { ...rest, avatarUrl: await this.signAvatarUrl(avatarKey) };
  }

  /**
   * Stores a member's own photo as a private object, then points the user row at it.
   * The previous object is deleted after the row is updated (best effort).
   */
  async uploadAvatar(
    userId: string,
    file: AvatarUploadFile | undefined,
  ): Promise<{ avatarUrl: string | null; avatarUpdatedAt: string | null }> {
    const buffer = file?.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException({
        message: 'Avatar file is required',
        code: AVATAR_ERROR_CODES.MISSING_FILE,
      });
    }
    if (buffer.length > AVATAR_MAX_BYTES) {
      throw new BadRequestException({
        message: 'Avatar file must be 5 MB or smaller',
        code: AVATAR_ERROR_CODES.TOO_LARGE,
      });
    }

    // Magic bytes decide the type; the client-supplied MIME header is ignored.
    const imageType = detectAvatarImageType(buffer);
    if (!imageType) {
      throw new BadRequestException({
        message: 'Avatar must be a JPEG, PNG or WebP image',
        code: AVATAR_ERROR_CODES.TYPE_UNSUPPORTED,
      });
    }

    const current = await this.getUserById(userId);
    if (!current) {
      throw new NotFoundException('User not found');
    }

    // Store a copy without EXIF, XMP or other metadata (location and device data).
    let cleaned: Buffer;
    try {
      cleaned = stripImageMetadata(buffer, imageType);
    } catch {
      throw new BadRequestException({
        message: 'Avatar image could not be read',
        code: AVATAR_ERROR_CODES.IMAGE_INVALID,
      });
    }

    const key = buildAvatarKey(userId, imageType, randomUUID());
    await this.fileUploadService.putPrivateObject(key, cleaned, imageType);

    let updated: User | undefined;
    try {
      [updated] = await this.db
        .update(users)
        .set({ avatarKey: key, avatarUpdatedAt: new Date() })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning();
    } catch (error: any) {
      // Do not leave an orphaned object when the row was not updated.
      await this.deleteObjectBestEffort(key);
      throw error;
    }

    if (!updated) {
      await this.deleteObjectBestEffort(key);
      throw new NotFoundException('User not found');
    }

    if (current.avatarKey && current.avatarKey !== key) {
      await this.deleteObjectBestEffort(current.avatarKey);
    }

    this.logger.log(`Avatar updated for user: ${userId}`);
    return {
      avatarUrl: await this.signAvatarUrl(key),
      avatarUpdatedAt: updated.avatarUpdatedAt ? updated.avatarUpdatedAt.toISOString() : null,
    };
  }

  /** Clears the avatar columns first, then deletes the stored object (best effort). */
  async removeAvatar(userId: string): Promise<void> {
    const current = await this.getUserById(userId);
    if (!current) {
      throw new NotFoundException('User not found');
    }

    await this.db
      .update(users)
      .set({ avatarKey: null, avatarUpdatedAt: null })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    if (current.avatarKey) {
      await this.deleteObjectBestEffort(current.avatarKey);
    }

    this.logger.log(`Avatar removed for user: ${userId}`);
  }

  private async signAvatarUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.fileUploadService.getSignedGetUrl(key, AVATAR_SIGNED_GET_TTL_SECONDS);
    } catch (error: any) {
      this.logger.warn(`Avatar URL signing failed: ${error?.name ?? 'Error'}`);
      return null;
    }
  }

  /** Storage errors are logged by name only and never reach the client. Keys are not logged here. */
  private async deleteObjectBestEffort(key: string): Promise<void> {
    try {
      await this.fileUploadService.deleteFromS3(key);
    } catch (error: any) {
      this.logger.warn(`Avatar object delete failed: ${error?.name ?? 'Error'}`);
    }
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
