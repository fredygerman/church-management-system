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
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { Public, GetUser } from './decorators';
import { RequirePermission } from './decorators/require-permission.decorator';
import { GoogleIdentityVerifier } from './google-identity-verifier';
import { randomBytes } from 'crypto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly googleIdentityVerifier: GoogleIdentityVerifier,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { name?: string; email?: string; password?: string }) {
    return this.authService.registerWithPassword(body.name ?? '', body.email ?? '', body.password ?? '');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email?: string; password?: string }) {
    return this.authService.loginWithPassword(body.email ?? '', body.password ?? '');
  }

  @Public()
  @Post('password-recovery')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordRecovery(@Body() body: { email?: string }, @Req() request: any) {
    return this.authService.requestPasswordRecovery(body?.email ?? '', request?.ip ?? 'unknown');
  }

  @Public()
  @Post('password-reset')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async confirmPasswordRecovery(@Body() body: { token?: string; newPassword?: string }) {
    return this.authService.confirmPasswordRecovery(body?.token ?? '', body?.newPassword ?? '');
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using a valid refresh token.',
  })
  @ApiBody({
    schema: {
      example: {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        success: true,
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
  })
  async refreshToken(@Body() body: { refreshToken?: string }) {
    // rotateRefreshToken throws UnauthorizedException for invalid, reused, or
    // pre-rotation tokens; other failures (e.g. database errors) surface as 500.
    return this.authService.rotateRefreshToken(body?.refreshToken);
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @RequirePermission('read:self')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user profile information.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing access token',
  })
  async getProfile(@GetUser() user: any) {
    this.logger.log(`Profile requested for user: ${user.id}`);
    return this.authService.getProfile(user.id);
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
      'Login or register with a verified Google ID token. Profile fields are never accepted as identity proof.',
  })
  @ApiBody({
    schema: { example: { provider: 'google', idToken: 'eyJhbGciOiJSUzI1NiIs...' } },
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'user@example.com',
            name: 'John Doe',
            picture: 'https://example.com/photo.jpg',
            role: 'member',
          },
        },
      },
    },
  })
  async oauthLogin(
    @Body()
    body: {
      provider?: string;
      idToken?: string;
    }
  ) {
    if (body?.provider !== 'google' || typeof body.idToken !== 'string' || !body.idToken.trim()) {
      throw new BadRequestException('provider and idToken are required');
    }

    const identity = await this.googleIdentityVerifier.verify(body.idToken);
    const { user, isNewUser } = await this.authService.oauthLogin(identity);
    
    if (!user) {
      throw new BadRequestException('Failed to create or update user');
    }

    const membership = await this.authService.getPreferredMembership(user.id, user.churchId);
    const tokens = await this.authService.generateTokens(user, membership);
    
    return {
      ...tokens,
      user,
      isNewUser,
    };
  }

  /**
   * Logout (client-side token removal)
   * POST /auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @RequirePermission('read:self')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout the authenticated user. Client should remove tokens after this call.',
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
  })
  async logout(@GetUser() user: any) {
    await this.authService.revokeTokens(user.id);
    this.logger.log(`User logged out: ${user.id}`);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Switch active church context
   * POST /auth/switch-church
   */
  @UseGuards(JwtAuthGuard)
  @Post('switch-church')
  @HttpCode(HttpStatus.OK)
  async switchChurch(
    @GetUser() user: any,
    @Body() body: { churchId: string },
  ) {
    if (!body.churchId) {
      throw new BadRequestException('churchId is required');
    }

    return this.authService.switchChurch(user.id, body.churchId);
  }

  /**
   * List the caller's own non-suspended church memberships
   * GET /auth/memberships
   */
  @UseGuards(JwtAuthGuard)
  @Get('memberships')
  @HttpCode(HttpStatus.OK)
  async listMemberships(@GetUser() user: any) {
    return this.authService.listOwnMemberships(user.id);
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
      const state = randomBytes(32).toString('hex');
      
      if (!clientId) {
        throw new BadRequestException('Google OAuth is not configured (missing GOOGLE_CLIENT_ID)');
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
      
      res.cookie('__google_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
        path: '/auth/google',
      });
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
    @Query('callbackUrl') callbackUrl?: string,
    @Req() req?: any,
    @Res() res?: any
  ) {
    try {
      if (!code) {
        throw new BadRequestException('Authorization code is required');
      }

      const expectedState = this.readCookie(req?.headers?.cookie, '__google_oauth_state');
      if (!state || !expectedState || state !== expectedState) {
        throw new UnauthorizedException('Invalid OAuth state');
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
      if (typeof tokenData.id_token !== 'string') {
        throw new UnauthorizedException('Google identity proof was not returned');
      }
      const identity = await this.googleIdentityVerifier.verify(tokenData.id_token);

      // Login/create user
      const { user, isNewUser } = await this.authService.oauthLogin(identity);

      if (!user) {
        throw new BadRequestException('Failed to create or update user');
      }

      // Generate tokens
      const membership = await this.authService.getPreferredMembership(user.id, user.churchId);
      const tokens = await this.authService.generateTokens(user, membership);

      // Set tokens as secure, HttpOnly cookies instead of query params to prevent token leakage
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('__tokens_access', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });
      res.cookie('__tokens_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      res.clearCookie('__google_oauth_state', { path: '/auth/google' });

      // Redirect to frontend callback page without tokens in URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('success', 'true');

      // Include the original callback URL if provided
      if (callbackUrl) {
        redirectUrl.searchParams.set('callbackUrl', callbackUrl);
      }

      this.logger.log(`Google OAuth successful for user: ${user.id}`);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = new URL(`${frontendUrl}/auth/signin`);
      errorUrl.searchParams.set('error', 'OAuth failed');

      return res.redirect(errorUrl.toString());
    }
  }

  /**
   * Setup endpoint - Creates the initial church and assigns a church-scoped admin
   * POST /auth/setup
   * Only accessible to users without an assigned church
   */
  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Setup initial church and admin',
    description:
      'Create the initial church and configure the user as a church-scoped admin. Requires server-authorized platform provisioning.',
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Main Church',
        location: 'City, State',
        leadPastorName: 'Pastor Name',
        phone: '1234567890',
        email: 'church@example.com',
        description: 'Church description',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Church setup successful',
    schema: {
      example: {
        success: true,
        data: {
          church: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Main Church',
            location: 'City, State',
            leadPastorName: 'Pastor Name',
          },
          user: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'user@example.com',
            name: 'User Name',
            role: 'admin',
            churchId: '550e8400-e29b-41d4-a716-446655440000',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an authorized platform provisioner',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has a church assigned or setup raced with another request',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing access token',
  })
  async setupChurch(
    @GetUser() user: any,
    @Body()
    body: {
      name: string;
      location: string;
      leadPastorName: string;
      phone?: string;
      email?: string;
      description?: string;
    }
  ) {
    // Ensure user doesn't already have a church assigned
    if (!this.authService.isPlatformAdmin(user)) {
      throw new ForbiddenException('Platform provisioning authorization required');
    }

    if (user.churchId) {
      throw new ConflictException('User already has a church assigned. Cannot setup again.');
    }

    try {
      // Create the initial church
      const church = await this.authService.setupInitialChurch(
        user.id,
        body.name,
        body.location,
        body.leadPastorName,
        {
          phone: body.phone,
          email: body.email,
          description: body.description,
        }
      );

      // Get the updated user (now with churchId and church-scoped admin role)
      const updatedUser = await this.authService.getProfile(user.id);

      // Generate new tokens with updated user info
      const membership = await this.authService.getPreferredMembership(updatedUser.id, church.id);
      const tokens = await this.authService.generateTokens(updatedUser, membership);

      this.logger.log(`Church setup completed for user: ${user.id}, church: ${church.id}`);

      return {
        church,
        user: updatedUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Church setup error:', error);
      throw error;
    }
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    return header
      ?.split(';')
      .map((part) => part.trim().split('='))
      .find(([key]) => key === name)?.[1];
  }
}
