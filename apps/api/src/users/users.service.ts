import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import {
  users,
  customerProfiles,
  userSettings,
  type User,
  type CustomerProfile,
  type UserSettings,
  UserRole,
} from '../../../../packages/config/src/schema';
import { eq, and, or, ne } from 'drizzle-orm';
import {
  UpdateAccountDto,
  UpdateBusinessDto,
  UpdateSettingsDto,
} from '../../../../packages/config/src/dtos/users';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly allowedS3Domains = [
    'church-uploads.s3.amazonaws.com',
    's3.amazonaws.com/church-uploads',
  ];

  constructor(
    private readonly db: DatabaseService,
    private readonly fileUploadService: FileUploadService,
  ) {
    this.logger.log('Users service initialized');
  }

  /**
   * Get user account details
   */
  async getAccount(userId: string): Promise<Omit<User, 'password'>> {
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    this.logger.log(`Retrieved account details for user: ${userId}`);
    return userWithoutPassword;
  }

  /**
   * Update user account details
   */
  async updateAccount(
    userId: string,
    dto: UpdateAccountDto,
  ): Promise<{ success: boolean; user: Omit<User, 'password'>; message: string }> {
    // Get current user
    const [currentUser] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Validate date of birth (must be 18+)
    if (dto.dateOfBirth) {
      this.validateAge(dto.dateOfBirth);
    }

    // Check for duplicate phone
    if (dto.phone && dto.phone !== currentUser.phone) {
      const existingPhone = await this.db
        .getDb()
        .select()
        .from(users)
        .where(and(eq(users.phone, dto.phone), ne(users.id, userId)))
        .limit(1);

      if (existingPhone.length > 0) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Check for duplicate TIN
    if (dto.tinNumber && dto.tinNumber !== currentUser.tinNumber) {
      const existingTin = await this.db
        .getDb()
        .select()
        .from(users)
        .where(and(eq(users.tinNumber, dto.tinNumber), ne(users.id, userId)))
        .limit(1);

      if (existingTin.length > 0) {
        throw new ConflictException('TIN number already registered');
      }
    }

    // Check for duplicate NIDA
    if (dto.nidaNumber && dto.nidaNumber !== currentUser.nidaNumber) {
      const existingNida = await this.db
        .getDb()
        .select()
        .from(users)
        .where(and(eq(users.nidaNumber, dto.nidaNumber), ne(users.id, userId)))
        .limit(1);

      if (existingNida.length > 0) {
        throw new ConflictException('NIDA number already registered');
      }
    }

    // Handle profile picture URL update
    let oldProfilePictureUrl: string | null = null;
    if (dto.profilePictureUrl) {
      // Validate S3 URL
      if (!this.validateS3Url(dto.profilePictureUrl)) {
        throw new ForbiddenException(
          'Profile picture URL must be from authorized S3 bucket',
        );
      }

      // Store old URL for deletion after successful update
      if (currentUser.profilePictureUrl && currentUser.profilePictureUrl !== dto.profilePictureUrl) {
        oldProfilePictureUrl = currentUser.profilePictureUrl;
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = dto.dateOfBirth;
    if (dto.tinNumber !== undefined) updateData.tinNumber = dto.tinNumber;
    if (dto.nidaNumber !== undefined) updateData.nidaNumber = dto.nidaNumber;
    if (dto.profilePictureUrl !== undefined)
      updateData.profilePictureUrl = dto.profilePictureUrl;

    // Update user in database
    const [updatedUser] = await this.db
      .getDb()
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Delete old profile picture from S3 if a new one was uploaded
    if (oldProfilePictureUrl) {
      try {
        await this.deleteS3File(oldProfilePictureUrl);
        this.logger.log(`Deleted old profile picture: ${oldProfilePictureUrl}`);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old profile picture: ${error.message}`,
        );
        // Don't fail the request if deletion fails
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    this.logger.log(`Updated account details for user: ${userId}`);

    return {
      success: true,
      user: userWithoutPassword,
      message: 'Account updated successfully',
    };
  }

  /**
   * Get customer business details
   */
  async getBusinessDetails(
    userId: string,
    userRole: string,
  ): Promise<CustomerProfile> {
    // Verify user is a customer
    if (userRole !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Business details are only available for customer accounts',
      );
    }

    const [profile] = await this.db
      .getDb()
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }

    this.logger.log(`Retrieved business details for user: ${userId}`);
    return profile;
  }

  /**
   * Update customer business details
   */
  async updateBusinessDetails(
    userId: string,
    userRole: string,
    dto: UpdateBusinessDto,
  ): Promise<{ success: boolean; business: CustomerProfile; message: string }> {
    // Verify user is a customer
    if (userRole !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Business details can only be updated for customer accounts',
      );
    }

    // Check for duplicate business registration number
    if (dto.businessRegistrationNumber) {
      const existing = await this.db
        .getDb()
        .select()
        .from(customerProfiles)
        .where(
          and(
            eq(
              customerProfiles.businessRegistrationNumber,
              dto.businessRegistrationNumber,
            ),
            ne(customerProfiles.userId, userId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          'Business registration number already registered',
        );
      }
    }

    // Check if profile exists
    const [existingProfile] = await this.db
      .getDb()
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    let profile: CustomerProfile;

    if (existingProfile) {
      // Update existing profile
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (dto.businessName !== undefined)
        updateData.businessName = dto.businessName;
      if (dto.businessRegistrationNumber !== undefined)
        updateData.businessRegistrationNumber = dto.businessRegistrationNumber;
      if (dto.country !== undefined) updateData.country = dto.country;
      if (dto.region !== undefined) updateData.region = dto.region;
      if (dto.district !== undefined) updateData.district = dto.district;
      if (dto.street !== undefined) updateData.street = dto.street;
      if (dto.houseNumber !== undefined) updateData.houseNumber = dto.houseNumber;

      [profile] = await this.db
        .getDb()
        .update(customerProfiles)
        .set(updateData)
        .where(eq(customerProfiles.userId, userId))
        .returning();

      this.logger.log(`Updated business details for user: ${userId}`);
    } else {
      // Create new profile (requires businessName and businessRegistrationNumber)
      if (!dto.businessName || !dto.businessRegistrationNumber) {
        throw new BadRequestException(
          'Business name and registration number are required to create a business profile',
        );
      }

      [profile] = await this.db
        .getDb()
        .insert(customerProfiles)
        .values({
          userId,
          businessName: dto.businessName,
          businessRegistrationNumber: dto.businessRegistrationNumber,
          country: dto.country,
          region: dto.region,
          district: dto.district,
          street: dto.street,
          houseNumber: dto.houseNumber,
        })
        .returning();

      this.logger.log(`Created business profile for user: ${userId}`);
    }

    return {
      success: true,
      business: profile,
      message: 'Business details updated successfully',
    };
  }

  /**
   * Get user settings
   */
  async getSettings(userId: string): Promise<UserSettings & { preferredLanguage: string }> {
    // Get user's preferred language
    const [user] = await this.db
      .getDb()
      .select({ preferredLanguage: users.preferredLanguage })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create user settings
    let [settings] = await this.db
      .getDb()
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings) {
      // Create default settings
      [settings] = await this.db
        .getDb()
        .insert(userSettings)
        .values({
          userId,
          darkMode: false,
          pushNotifications: true,
          emailAlerts: true,
          smsNotifications: true,
          transactionNotifications: true,
          billPaymentReminders: true,
        })
        .returning();

      this.logger.log(`Created default settings for user: ${userId}`);
    }

    this.logger.log(`Retrieved settings for user: ${userId}`);

    return {
      ...settings,
      preferredLanguage: user.preferredLanguage,
    };
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<{
    success: boolean;
    settings: UserSettings & { preferredLanguage: string };
    message: string;
  }> {
    // Verify user exists
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create user settings
    let [existingSettings] = await this.db
      .getDb()
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // Build settings update object
    const settingsUpdateData: any = {
      updatedAt: new Date(),
    };

    if (dto.darkMode !== undefined) settingsUpdateData.darkMode = dto.darkMode;
    if (dto.pushNotifications !== undefined)
      settingsUpdateData.pushNotifications = dto.pushNotifications;
    if (dto.emailAlerts !== undefined)
      settingsUpdateData.emailAlerts = dto.emailAlerts;
    if (dto.smsNotifications !== undefined)
      settingsUpdateData.smsNotifications = dto.smsNotifications;
    if (dto.transactionNotifications !== undefined)
      settingsUpdateData.transactionNotifications = dto.transactionNotifications;
    if (dto.billPaymentReminders !== undefined)
      settingsUpdateData.billPaymentReminders = dto.billPaymentReminders;

    let updatedSettings: UserSettings;

    if (existingSettings) {
      // Update existing settings
      [updatedSettings] = await this.db
        .getDb()
        .update(userSettings)
        .set(settingsUpdateData)
        .where(eq(userSettings.userId, userId))
        .returning();
    } else {
      // Create new settings with provided values
      [updatedSettings] = await this.db
        .getDb()
        .insert(userSettings)
        .values({
          userId,
          darkMode: dto.darkMode ?? false,
          pushNotifications: dto.pushNotifications ?? true,
          emailAlerts: dto.emailAlerts ?? true,
          smsNotifications: dto.smsNotifications ?? true,
          transactionNotifications: dto.transactionNotifications ?? true,
          billPaymentReminders: dto.billPaymentReminders ?? true,
        })
        .returning();
    }

    // Update preferred language in users table if provided
    let preferredLanguage = user.preferredLanguage;
    if (dto.preferredLanguage !== undefined) {
      const [updatedUser] = await this.db
        .getDb()
        .update(users)
        .set({
          preferredLanguage: dto.preferredLanguage,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({ preferredLanguage: users.preferredLanguage });

      preferredLanguage = updatedUser.preferredLanguage;
    }

    this.logger.log(`Updated settings for user: ${userId}`);

    return {
      success: true,
      settings: {
        ...updatedSettings,
        preferredLanguage,
      },
      message: 'Settings updated successfully',
    };
  }

  /**
   * Get combined account summary (account + business + settings)
   */
  async getAccountSummary(userId: string, userRole: string): Promise<{
    account: Omit<User, 'password'>;
    business?: CustomerProfile | null;
    settings: UserSettings & { preferredLanguage: string };
  }> {
    // Get account details
    const account = await this.getAccount(userId);

    // Get business details (only for customers)
    let business: CustomerProfile | null = null;
    if (userRole === UserRole.CUSTOMER) {
      try {
        business = await this.getBusinessDetails(userId, userRole);
      } catch (error) {
        // Business profile may not exist yet
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    // Get settings
    const settings = await this.getSettings(userId);

    this.logger.log(`Retrieved account summary for user: ${userId}`);

    return {
      account,
      business,
      settings,
    };
  }

  /**
   * Validate age (must be 18+)
   */
  private validateAge(dateOfBirth: string): void {
    const dob = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is in the future
    if (dob > today) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      throw new BadRequestException('User must be at least 18 years old');
    }
  }

  /**
   * Validate S3 URL is from authorized bucket
   */
  private validateS3Url(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.allowedS3Domains.some(domain =>
        urlObj.hostname.includes(domain) || url.includes(domain),
      );
    } catch {
      return false;
    }
  }

  /**
   * Delete file from S3
   */
  private async deleteS3File(fileUrl: string): Promise<void> {
    try {
      // Extract S3 key from URL
      // Example: https://church-uploads.s3.amazonaws.com/profileImages/123_file.jpg
      // Key: profileImages/123_file.jpg
      const urlParts = fileUrl.split('.com/');
      if (urlParts.length < 2) {
        throw new Error('Invalid S3 URL format');
      }

      const key = urlParts[1];

      // Use FileUploadService to delete from S3
      await this.fileUploadService.deleteFromS3(key);
    } catch (error) {
      this.logger.error(`Failed to delete S3 file: ${error.message}`);
      throw error;
    }
  }
}
