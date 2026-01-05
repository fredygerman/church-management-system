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
import { JwtAuthGuard } from './guards';
import { Public, GetUser } from './decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

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
  async refreshToken(@Body() body: { refreshToken: string }) {
    // Verify refresh token and return new tokens
    try {
      const decoded = await this.authService.verifyRefreshToken(body.refreshToken);
      const tokens = this.authService.generateTokens(decoded as any);
      
      return tokens;
    } catch (error) {
      throw new BadRequestException('Invalid or expired refresh token');
    }
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
      'Login or register user via OAuth (Google, etc). If user does not exist, creates new user with member role.',
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
      email: string;
      name: string;
      picture?: string;
    }
  ) {
    const { user, isNewUser } = await this.authService.oauthLogin(body.email, body.name, body.picture);
    
    if (!user) {
      throw new BadRequestException('Failed to create or update user');
    }

    const tokens = this.authService.generateTokens(user);
    
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
    this.logger.log(`User logged out: ${user.id}`);
    return {
      success: true,
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
    @Query('callbackUrl') callbackUrl?: string,
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
      const { user, isNewUser } = await this.authService.oauthLogin(
        userInfo.email,
        userInfo.name || userInfo.email,
        userInfo.picture
      );

      if (!user) {
        throw new BadRequestException('Failed to create or update user');
      }

      // Generate tokens
      const tokens = this.authService.generateTokens(user);

      // Redirect to frontend with tokens in query params
      // Frontend will extract these and create a session
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('accessToken', tokens.accessToken);
      redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
      
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
      errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'OAuth failed');

      return res.redirect(errorUrl.toString());
    }
  }

  /**
   * Setup endpoint - Creates the initial church and assigns user as super_admin
   * POST /auth/setup
   * Only accessible to users without an assigned church
   */
  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Setup initial church and admin',
    description:
      'Create the initial church and configure the user as super_admin. Only available for new users without an assigned church.',
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
            role: 'super_admin',
            churchId: '550e8400-e29b-41d4-a716-446655440000',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or user already has a church assigned',
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
    if (user.churchId) {
      throw new BadRequestException('User already has a church assigned. Cannot setup again.');
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

      // Get the updated user (now with churchId and super_admin role)
      const updatedUser = await this.authService.getProfile(user.id);

      // Generate new tokens with updated user info
      const tokens = this.authService.generateTokens(updatedUser);

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
}
