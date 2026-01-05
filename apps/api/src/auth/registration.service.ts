import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq } from 'drizzle-orm';
import { users } from '../database/schema';

/**
 * Simplified registration service for church app
 * Uses OAuth for authentication - no complex multi-step registration
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(private readonly db: DatabaseService) {
    this.logger.log('Registration service initialized');
  }

  /**
   * Check if user can register (email not already used)
   */
  async validateEmailAvailable(email: string): Promise<boolean> {
    const [existingUser] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    return true;
  }

  /**
   * Update user profile after OAuth signup
   * (Optional - user can update this later)
   */
  async updateProfile(
    userId: string,
    dto: {
      name?: string;
      picture?: string;
    },
  ): Promise<any> {
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.picture) updateData.picture = dto.picture;

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const [updatedUser] = await this.db
      .getDb()
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    this.logger.log(`User profile updated: ${userId}`);
    return updatedUser;
  }
}
