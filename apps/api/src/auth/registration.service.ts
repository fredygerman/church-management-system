import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';
import {
  users,
  customerProfiles,
  documents,
  type User,
  type NewCustomerProfile,
  OtpPurpose,
  UserRole,
  UserStatus,
  DocumentType,
  VerificationStatus,
} from '../../../../packages/config/src/schema';
import { eq, or } from 'drizzle-orm';
import {
  RegisterStep1Dto,
  RegisterStep2Dto,
  RegisterStep3Dto,
  RegisterStep4Dto,
  RegisterStep5Dto,
  ResendOtpDto,
  UploadedDocumentDto,
} from '../../../../packages/config/src/dtos/registration';

export interface RegistrationStatusResponse {
  userId: string;
  currentStep: number;
  completedSteps: number[];
  registrationCompleted: boolean;
  user: Partial<Omit<User, 'password'>>;
  nextStep?: {
    step: number;
    title: string;
    description: string;
  };
}

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService
  ) {
    this.logger.log('Registration service initialized');
  }

  /**
   * Validate age (must be 18+)
   */
  private validateAge(dateOfBirth: string): boolean {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      throw new BadRequestException('User must be at least 18 years old');
    }

    return true;
  }

  /**
   * Validate that user exists and is at the expected registration step
   */
  private async validateRegistrationStep(
    userId: string,
    expectedStep: number
  ): Promise<User> {
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.registrationStep !== expectedStep) {
      throw new BadRequestException(
        `User must complete step ${expectedStep} first. Current step: ${user.registrationStep}`
      );
    }

    return user;
  }

  /**
   * STEP 1: Basic Information Registration
   * Creates user account and sends OTP for verification
   */
  async registerStep1(
    dto: RegisterStep1Dto
  ): Promise<{ userId: string; message: string }> {
    const { fullName, email, phone, password } = dto;

    // At least email OR phone must be provided
    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Check if user already exists
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const existingUser = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (existingUser.length > 0) {
      if (existingUser[0].email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser[0].phone === phone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Split fullName into firstName and lastName
    const result = fullName.trim().split(/\s+/);
    const firstName = result[0] || fullName;
    const lastName = result.slice(1).join(' ') || '';

    // Use AuthService to register (it handles password hashing, OTP, etc.)
    const registrationResult = await this.authService.register({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    // Set user properties for registration flow
    await this.db.getDb().update(users).set({
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING,
      registrationStep: 1,
      registrationCompleted: false,
    });

    this.logger.log(`User registered - Step 1: ${registrationResult.userId}`);

    return {
      message: registrationResult.message,
      userId: registrationResult.userId,
      // otpSent is included in message
    };
  }

  /**
   * STEP 2: OTP Verification
   * Verifies OTP and returns authentication tokens
   */
  async registerStep2(dto: RegisterStep2Dto): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
    nextStep: number;
  }> {
    const { userId, otp, email, phone } = dto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Validate user is at step 1
    const user = await this.validateRegistrationStep(userId, 1);

    // Verify that the provided contact matches the user's contact
    if (email && user.email !== email) {
      throw new BadRequestException('Email does not match registered email');
    }
    if (phone && user.phone !== phone) {
      throw new BadRequestException(
        'Phone number does not match registered phone'
      );
    }

    // Use AuthService to verify OTP (it handles verification logic)
    const authData = await this.authService.verifyRegistrationOtp({
      code: otp,
      email,
      phone,
    });

    // Update registration step (AuthService already set isVerified=true)
    await this.db
      .getDb()
      .update(users)
      .set({
        registrationStep: 2,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    this.logger.log(`User verified - Step 2: ${userId}`);

    // Remove password from user object
    // const { password, ...userWithoutPassword } = updatedUser;

    // // Generate authentication tokens
    // const tokens = this.authService.generateTokens(userWithoutPassword);

    return {
      success: true,
      ...authData,
      // accessToken: tokens.accessToken,
      // refreshToken: tokens.refreshToken,
      // user: userWithoutPassword,
      nextStep: 3,
    };
  }

  /**
   * STEP 3: Additional Details
   */
  async registerStep3(
    dto: RegisterStep3Dto
  ): Promise<{ success: boolean; nextStep: number }> {
    const { userId, email, phone, dateOfBirth, tinNumber, nidaNumber } = dto;

    // Validate user is at step 2
    const user = await this.validateRegistrationStep(userId, 2);

    // Validate age (18+)
    this.validateAge(dateOfBirth);

    // If user didn't provide email/phone in step 1, add it now
    if (email && !user.email) {
      // Check if email already exists
      const existingEmail = await this.db
        .getDb()
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail.length > 0) {
        throw new ConflictException('Email already registered');
      }
    }

    if (phone && !user.phone) {
      // Check if phone already exists
      const existingPhone = await this.db
        .getDb()
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (existingPhone.length > 0) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Check if TIN already exists
    const existingTin = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.tinNumber, tinNumber))
      .limit(1);

    if (existingTin.length > 0) {
      throw new ConflictException('TIN number already registered');
    }

    // Check if NIDA already exists
    const existingNida = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.nidaNumber, nidaNumber))
      .limit(1);

    if (existingNida.length > 0) {
      throw new ConflictException('NIDA number already registered');
    }

    // Update user with additional contact if provided
    await this.db
      .getDb()
      .update(users)
      .set({
        email: email || user.email,
        phone: phone || user.phone,
        dateOfBirth,
        tinNumber,
        nidaNumber,
        registrationStep: 3,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    this.logger.log(`User details updated - Step 3: ${userId}`);

    return {
      success: true,
      nextStep: 4,
    };
  }

  /**
   * STEP 4: Business Profile & Documents
   */
  async registerStep4(
    dto: RegisterStep4Dto,
    uploadedFiles: UploadedDocumentDto[]
  ): Promise<{
    success: boolean;
    nextStep: number;
    documentsUploaded: number;
  }> {
    const { userId, businessName, businessRegistrationNumber } = dto;

    // Validate user is at step 3
    await this.validateRegistrationStep(userId, 3);

    // Validate file uploads
    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new BadRequestException('At least one document is required');
    }

    // Validate file types and sizes
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of uploadedFiles) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, PDF`
        );
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum size of 5MB`
        );
      }
    }

    // Check if business registration number already exists
    const existingBusiness = await this.db
      .getDb()
      .select()
      .from(customerProfiles)
      .where(
        eq(
          customerProfiles.businessRegistrationNumber,
          businessRegistrationNumber
        )
      )
      .limit(1);

    if (existingBusiness.length > 0) {
      throw new ConflictException(
        'Business registration number already registered'
      );
    }

    // Use database transaction
    const result = await this.db.getDb().transaction(async tx => {
      // Update or create customer profile with business info
      const [profile] = await tx
        .insert(customerProfiles)
        .values({
          userId,
          businessName,
          businessRegistrationNumber,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: customerProfiles.userId,
          set: {
            businessName,
            businessRegistrationNumber,
            updatedAt: new Date(),
          },
        })
        .returning();

      // Upload files and store document records
      const uploadedDocs = [];
      for (const file of uploadedFiles) {
        // Upload file to storage (S3, local, etc.)
        const fileUrl = await this.uploadFile(file);

        const [doc] = await tx
          .insert(documents)
          .values({
            userId,
            documentType: this.determineDocumentType(file.originalname),
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileUrl: fileUrl,
            verificationStatus: VerificationStatus.PENDING,
          })
          .returning();

        uploadedDocs.push(doc);
      }

      // Update registration step
      await tx
        .update(users)
        .set({
          registrationStep: 4,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { profile, uploadedDocs };
    });

    this.logger.log(
      `Business profile & documents uploaded - Step 4: ${userId}`
    );

    return {
      success: true,
      nextStep: 5,
      documentsUploaded: result.uploadedDocs.length,
    };
  }

  /**
   * STEP 5: Address Details (Final Step)
   * No longer returns tokens - user is already authenticated from Step 2
   */
  async registerStep5(dto: RegisterStep5Dto): Promise<{
    success: boolean;
    message: string;
    registrationComplete: boolean;
  }> {
    const { userId, country, region, district, street, houseNumber } = dto;

    // Validate user is at step 4
    const user = await this.validateRegistrationStep(userId, 4);

    // Use database transaction
    await this.db.getDb().transaction(async tx => {
      // Update customer profile with address
      await tx
        .update(customerProfiles)
        .set({
          country,
          region,
          district,
          street,
          houseNumber,
          updatedAt: new Date(),
        })
        .where(eq(customerProfiles.userId, userId));

      // Complete registration: activate user and mark registration as complete
      await tx
        .update(users)
        .set({
          registrationStep: 5,
          registrationCompleted: true,
          status: UserStatus.ACTIVE,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
    });

    this.logger.log(`Registration completed - Step 5: ${userId}`);

    // Send welcome email/SMS notification
    try {
      if (user.email) {
        this.logger.log(`Welcome email will be sent to ${user.email}`);

        // TODO: Implement welcome email sending here
      }
    } catch (error) {
      this.logger.error('Failed to send welcome message:', error);
    }

    return {
      success: true,
      message:
        'Registration completed successfully! Your account is now fully activated.',
      registrationComplete: true,
    };
  }

  /**
   * Get registration status and progress
   */
  async getRegistrationStatus(
    userId: string
  ): Promise<RegistrationStatusResponse> {
    // Get user
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine completed steps
    const completedSteps = [];
    for (let i = 1; i <= user.registrationStep; i++) {
      completedSteps.push(i);
    }

    // Step information
    const stepTitles = {
      1: {
        title: 'Basic Information',
        description: 'Create account with email/phone and password',
      },
      2: {
        title: 'OTP Verification',
        description: 'Verify your email or phone number',
      },
      3: {
        title: 'Personal Details',
        description: 'Add date of birth, TIN, and NIDA number',
      },
      4: {
        title: 'Business Profile',
        description: 'Add business information and upload documents',
      },
      5: {
        title: 'Address Details',
        description: 'Complete registration with address information',
      },
    };

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return {
      userId: user.id,
      currentStep: user.registrationStep,
      completedSteps,
      registrationCompleted: user.registrationCompleted,
      user: userWithoutPassword,
      nextStep: !user.registrationCompleted
        ? stepTitles[user.registrationStep + 1]
        : undefined,
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const { userId, email, phone, purpose } = dto;

    // Validate user exists
    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use AuthService to resend OTP
    return this.authService.resendOtp(email, phone, purpose);
  }

  /**
   * Helper: Upload file to storage
   * TODO: Implement actual file upload to S3 or other storage
   */
  private async uploadFile(file: UploadedDocumentDto): Promise<string> {
    // For now, return a placeholder URL
    // Upload to S3, Azure Blob, etc.
    // Example: await this.s3Service.upload(file)

    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUrl = `/uploads/documents/${timestamp}_${sanitizedFilename}`;

    this.logger.log(`File uploaded: ${fileUrl}`);

    return fileUrl;
  }

  /**
   * Helper: Determine document type from filename
   */
  private determineDocumentType(
    filename: string
  ): (typeof DocumentType)[keyof typeof DocumentType] {
    const lowerFilename = filename.toLowerCase();

    if (
      lowerFilename.includes('license') ||
      lowerFilename.includes('licence')
    ) {
      return DocumentType.BUSINESS_LICENSE;
    }
    if (lowerFilename.includes('registration')) {
      return DocumentType.BUSINESS_REGISTRATION;
    }
    if (
      lowerFilename.includes('national') ||
      lowerFilename.includes('nida') ||
      lowerFilename.includes('id')
    ) {
      return DocumentType.NATIONAL_ID;
    }
    if (lowerFilename.includes('driver')) {
      return DocumentType.DRIVERS_LICENSE;
    }

    // Default to business license
    return DocumentType.BUSINESS_LICENSE;
  }
}
