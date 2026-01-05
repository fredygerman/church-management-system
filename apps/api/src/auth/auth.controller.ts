import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '../../../../packages/config/src/dtos/auth';
import { JwtAuthGuard, JwtRefreshGuard } from './guards';
import { Public, GetUser } from './decorators';
import type { User } from '../../../../packages/config/src/schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Login user
   * POST /auth/login
   * Use /auth/register/step-1 through step-5 for registration
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user with email/phone and password',
    description:
      'Authenticate user with email or phone number and password. Returns JWT access token and refresh token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, tokens returned',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john@example.com',
            fullName: 'John Doe',
            phone: '+1234567890',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account not verified',
    schema: {
      example: {
        success: false,
        message: 'Invalid credentials',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.email || loginDto.phone}`);
    return this.authService.login(loginDto);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generate new access token and refresh token using a valid refresh token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        success: false,
        message: 'Invalid or expired refresh token',
      },
    },
  })
  async refreshToken(
    @GetUser() user: Omit<User, 'password'>,
    @Body() refreshTokenDto: RefreshTokenDto
  ) {
    this.logger.log(`Token refresh for user: ${user.id}`);
    return this.authService.refreshToken(user);
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieve the authenticated user profile information. Requires valid JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john@example.com',
          fullName: 'John Doe',
          phone: '+1234567890',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing access token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
      },
    },
  })
  async getProfile(@GetUser() user: Omit<User, 'password'>) {
    this.logger.log(`Profile requested for user: ${user.id}`);
    return this.authService.getProfile(user.id);
  }

  /**
   * Request password reset
   * POST /auth/password-reset/request
   */
  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Request a password reset OTP to be sent to email or phone number.',
  })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
    schema: {
      example: {
        success: true,
        message:
          'A password reset code has been sent to your email/phone number.',
        data: {
          sentTo: 'john@example.com',
          expiresIn: '10 minutes',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found (generic message for security)',
    schema: {
      example: {
        success: true,
        message:
          'If an account exists, a password reset code has been sent to your email/phone.',
      },
    },
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    this.logger.log(`Password reset requested for: ${dto.email || dto.phone}`);
    return this.authService.requestPasswordReset(dto);
  }

  /**
   * Reset password with OTP
   * POST /auth/password-reset/confirm
   */
  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with OTP',
    description:
      'Reset user password using the OTP code sent to email/phone and new password.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        success: true,
        message:
          'Password reset successful. You can now login with your new password.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or password validation failed',
    schema: {
      example: {
        success: false,
        message: 'Invalid or expired OTP code',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - OTP verification failed',
    schema: {
      example: {
        success: false,
        message: 'Invalid or expired OTP',
      },
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.log(
      `Password reset confirmation for: ${dto.email || dto.phone}`
    );
    return this.authService.resetPassword(dto);
  }

  /**
   * OAuth login/signup
   * POST /auth/oauth-login
   */
  @Public()
  @Post('oauth-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OAuth login/signup',
    description:
      'Login or register user via OAuth (Google, etc). If user does not exist, creates new user.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
  })
  async oauthLogin(
    @Body()
    body: {
      email: string;
      name: string;
      picture?: string;
    }
  ) {
    return this.authService.oauthLogin(body.email, body.name, body.picture);
  }

  /**
   * Logout (client-side token removal)
   * POST /auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logout the authenticated user. Client should remove tokens after this call.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing access token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
      },
    },
  })
  async logout(@GetUser() user: Omit<User, 'password'>) {
    this.logger.log(`User logged out: ${user.id}`);
    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  @Public()
  @Get('google')
  @ApiOperation({
    summary: 'Initiate Google OAuth',
    description:
      'Redirect user to Google OAuth consent screen. After user authorizes, Google redirects back to /auth/google/callback',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth',
  })
  async googleAuth(@Res() res: any) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${process.env.API_BASE_URL || 'http://localhost:3001'}/auth/google/callback`;
      const scope = 'openid profile email';
      
      if (!clientId) {
        throw new BadRequestException('Google OAuth is not configured (missing GOOGLE_CLIENT_ID)');
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
      
      this.logger.debug(`Redirecting to Google OAuth URL: ${googleAuthUrl}`);
      return res.redirect(googleAuthUrl);
    } catch (error) {
      this.logger.error('Google Auth initiation error:', error);
      throw error;
    }
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   */
  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state?: string,
    @Res() res?: any
  ) {
    try {
      if (!code) {
        throw new BadRequestException('Authorization code is required');
      }

      // Exchange code for tokens with Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/auth/google/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new BadRequestException('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new BadRequestException('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();

      // Login/create user
      const authResponse = await this.authService.oauthLogin(
        userInfo.email,
        userInfo.name || userInfo.email,
        userInfo.picture
      );

      // Redirect to frontend with tokens in query params
      // Frontend will extract these and store in cookies/localStorage
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('accessToken', authResponse.accessToken);
      redirectUrl.searchParams.set('refreshToken', authResponse.refreshToken);

      this.logger.log(`Google OAuth successful for user: ${authResponse.user.id}`);
      
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = new URL(`${frontendUrl}/auth/signin`);
      errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'OAuth failed');

      return res.redirect(errorUrl.toString());
    }
  }
}
