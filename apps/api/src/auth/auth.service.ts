import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import {
  users,
  otps,
  type User,
  type NewUser,
  OtpPurpose,
} from '../../../../packages/config/src/schema';
import { eq, or, and, gt } from 'drizzle-orm';
import config from '../config';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '../../../../packages/config/src/dtos/auth';

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
  private readonly saltRounds = 10;
  private readonly otpExpiryMinutes = 10;
  private readonly notificationMethod: 'EMAIL' | 'SMS';

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService
  ) {
    this.notificationMethod =
      (process.env.NOTIFICATION_METHOD as 'EMAIL' | 'SMS') || 'EMAIL';
    this.logger.log(
      `Auth service initialized with notification method: ${this.notificationMethod}`
    );
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens (access and refresh)
   * Public for use by RegistrationService
   */
  generateTokens(user: Omit<User, 'password'>): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
    };

    // @ts-ignore
    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.secret,
      expiresIn: config.jwt.accessTokenExpiresIn || '1h',
    });

    // @ts-ignore
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: config.jwt.secret,
        expiresIn: config.jwt.refreshTokenExpiresIn || '7d',
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Create and store OTP
   * Public for use by RegistrationService
   */
  async createOtp(
    userId: string,
    purpose: string
  ): Promise<{ code: string; expiresAt: Date }> {
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    await this.db.getDb().insert(otps).values({
      userId,
      code,
      purpose,
      expiresAt,
      isUsed: false,
    });

    this.logger.log(
      `OTP created for user ${userId}, purpose: ${purpose}, expires at: ${expiresAt}`
    );

    return { code, expiresAt };
  }

  /**
   * Verify OTP
   * Public for use by RegistrationService
   */
  async verifyOtp(
    userId: string,
    code: string,
    purpose: string
  ): Promise<boolean> {
    const [otp] = await this.db
      .getDb()
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.code, code),
          eq(otps.purpose, purpose),
          eq(otps.isUsed, false),
          gt(otps.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!otp) {
      return false;
    }

    // Mark OTP as used
    await this.db
      .getDb()
      .update(otps)
      .set({ isUsed: true })
      .where(eq(otps.id, otp.id));

    return true;
  }

  /**
   * Send OTP via configured notification method
   * Public for use by RegistrationService
   */
  async sendOtp(
    user: Omit<User, 'password'>,
    code: string,
    purpose: string
  ): Promise<void> {
    const message = `Your verification code is: ${code}. This code will expire in ${this.otpExpiryMinutes} minutes.`;

    if (!!user.email) {
      await this.mailService.sendEmail({
        to: user.email,
        subject: `Your OTP Code - ${purpose}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verification Code</h2>
            <p>Hi ${user.firstName},</p>
            <p>${message}</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`OTP sent via EMAIL to ${user.email}`);
    } else if (!!user.phone) {
      await this.smsService.sendSms({
        userId: user.id,
        to: user.phone,
        message,
        category: 'AUTH',
        purpose: `OTP-${purpose}`,
        showInApp: false,
      });

      this.logger.log(`OTP sent via SMS to ${user.phone}`);
    } else {
      throw new BadRequestException(
        'Either email or phone number is required for verification'
      );
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<{
    message: string;
    userId: string;
    requiresVerification: boolean;
  }> {
    const { firstName, lastName, email, phone, password } = registerDto;

    // Validate that at least email or phone is provided
    if (!email && !phone) {
      throw new BadRequestException('Either email or phone number is required');
    }

    // Check if user already exists
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [existingUser] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const newUser: NewUser = {
      firstName,
      lastName,
      email: email || '',
      phone: phone || null,
      password: hashedPassword,
      isActive: false, // Set to false until OTP verification
    };

    const [createdUser] = await this.db
      .getDb()
      .insert(users)
      .values(newUser)
      .returning();

    this.logger.log(`User registered: ${createdUser.id}`);

    // Generate and send OTP
    const { code } = await this.createOtp(
      createdUser.id,
      OtpPurpose.REGISTRATION
    );

    const { password: _, ...userWithoutPassword } = createdUser;
    await this.sendOtp(userWithoutPassword, code, 'Registration');

    return {
      message: `Registration successful. Please verify your ${userWithoutPassword.email === 'EMAIL' ? 'email' : 'phone number'}.`,
      userId: createdUser.id,
      requiresVerification: true,
    };
  }

  /**
   * Verify OTP after registration
   */
  async verifyRegistrationOtp(
    verifyOtpDto: VerifyOtpDto
  ): Promise<AuthResponse> {
    const { code, email, phone } = verifyOtpDto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Find user
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const isValid = await this.verifyOtp(
      user.id,
      code,
      OtpPurpose.REGISTRATION
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Activate user
    await this.db
      .getDb()
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, user.id));

    this.logger.log(`User verified and activated: ${user.id}`);

    // Generate tokens
    const { password, ...userWithoutPassword } = user;
    const tokens = this.generateTokens(userWithoutPassword);

    // Send welcome email/SMS
    try {
      if (this.notificationMethod === 'EMAIL' && user.email) {
        await this.mailService.sendWelcomeEmail(user.email, user.firstName);
      }
    } catch (error) {
      this.logger.error('Failed to send welcome message:', error);
      // Don't fail registration if welcome message fails
    }

    return {
      ...tokens,
      user: { ...userWithoutPassword, isActive: true },
    };
  }

  /**
   * Validate user credentials (used by LocalStrategy)
   */
  async validateUser(
    email?: string,
    phone?: string,
    password?: string
  ): Promise<Omit<User, 'password'> | null> {
    if (!email && !phone) {
      return null;
    }

    // Find user by email or phone
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (!user) {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account not verified. Please verify your account.'
      );
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, phone, password } = loginDto;

    const user = await this.validateUser(email, phone, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    this.logger.log(`User logged in: ${user.id}`);

    return {
      ...tokens,
      user,
    };
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

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    dto: RequestPasswordResetDto
  ): Promise<{ message: string }> {
    const { email, phone } = dto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Find user
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists or not
      return {
        message: `If an account exists, a password reset code has been sent to your ${this.notificationMethod === 'EMAIL' ? 'email' : 'phone'}.`,
      };
    }

    // Generate and send OTP
    const { code } = await this.createOtp(user.id, OtpPurpose.PASSWORD_RESET);

    const { password: _, ...userWithoutPassword } = user;
    await this.sendOtp(userWithoutPassword, code, 'Password Reset');

    this.logger.log(`Password reset requested for user: ${user.id}`);

    return {
      message: `A password reset code has been sent to your ${this.notificationMethod === 'EMAIL' ? 'email' : 'phone'}.`,
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, phone, code, newPassword } = dto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Find user
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const isValid = await this.verifyOtp(
      user.id,
      code,
      OtpPurpose.PASSWORD_RESET
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.db
      .getDb()
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    this.logger.log(`Password reset successful for user: ${user.id}`);

    // Send confirmation
    try {
      const { password: _, ...userWithoutPassword } = user;
      const message = 'Your password has been successfully reset.';

      if (this.notificationMethod === 'EMAIL' && user.email) {
        await this.mailService.sendEmail({
          to: user.email,
          subject: 'Password Reset Successful',
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Successful</h2>
              <p>Hi ${user.firstName},</p>
              <p>${message}</p>
              <p>If you didn't make this change, please contact support immediately.</p>
            </div>
          `,
        });
      } else if (this.notificationMethod === 'SMS' && user.phone) {
        await this.smsService.sendSms({
          userId: user.id,
          to: user.phone,
          message,
          category: 'AUTH',
          purpose: 'PASSWORD_RESET_CONFIRMATION',
          showInApp: false,
        });
      }
    } catch (error) {
      this.logger.error('Failed to send password reset confirmation:', error);
    }

    return {
      message:
        'Password reset successful. You can now login with your new password.',
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(
    email?: string,
    phone?: string,
    purpose: string = OtpPurpose.REGISTRATION
  ): Promise<{ message: string }> {
    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Find user
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));

    const [user] = await this.db
      .getDb()
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate and send new OTP
    const { code } = await this.createOtp(user.id, purpose);

    const { password: _, ...userWithoutPassword } = user;
    await this.sendOtp(
      userWithoutPassword,
      code,
      purpose === OtpPurpose.REGISTRATION ? 'Registration' : 'Password Reset'
    );

    this.logger.log(`OTP resent for user: ${user.id}, purpose: ${purpose}`);

    return {
      message: `A new verification code has been sent to your ${this.notificationMethod === 'EMAIL' ? 'email' : 'phone'}.`,
    };
  }
}
