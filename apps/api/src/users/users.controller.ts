import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard, RoleGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import {
  UpdateAccountDto,
  UpdateBusinessDto,
  UpdateSettingsDto,
} from '../../../../packages/config/src/dtos/users';
import { UserRole } from '../../../../packages/config/src/schema';

@ApiTags('User Account Management')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/account
   * Get current user's account details
   */
  @Get('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get account details',
    description:
      'Retrieve current user account information including personal details',
  })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@church.org',
          phone: '+255712345678',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          dateOfBirth: '1990-05-15',
          tinNumber: 'TZ123456789',
          nidaNumber: '19900515123456789012',
          profilePictureUrl:
            'https://church-uploads.s3.amazonaws.com/profileImages/123_profile.jpg',
          preferredLanguage: 'EN',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          isActive: true,
          isVerified: true,
          registrationCompleted: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T12:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getAccount(@Request() req: any) {
    const userId = req.user.id;
    const account = await this.usersService.getAccount(userId);

    return {
      success: true,
      data: account,
    };
  }

  /**
   * PATCH /api/users/account
   * Update user account details
   */
  @Patch('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update account details',
    description:
      'Update user personal information. Email cannot be changed via this endpoint.',
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
    schema: {
      example: {
        success: true,
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@church.org',
          phone: '+255712345678',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          dateOfBirth: '1990-05-15',
          tinNumber: 'TZ123456789',
          nidaNumber: '19900515123456789012',
          profilePictureUrl:
            'https://church-uploads.s3.amazonaws.com/profileImages/456_new.jpg',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          updatedAt: '2024-01-16T14:00:00Z',
        },
        message: 'Account updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid data format or constraints',
    schema: {
      example: {
        success: false,
        message: 'User must be at least 18 years old',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Profile picture URL from unauthorized domain',
    schema: {
      example: {
        success: false,
        message: 'Profile picture URL must be from authorized S3 bucket',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Phone/TIN/NIDA already exists',
    schema: {
      example: {
        success: false,
        message: 'Phone number already registered',
      },
    },
  })
  async updateAccount(
    @Request() req: any,
    @Body() updateAccountDto: UpdateAccountDto
  ) {
    const userId = req.user.id;
    const result = await this.usersService.updateAccount(
      userId,
      updateAccountDto
    );

    this.logger.log(`User ${userId} updated account details`);

    return result;
  }

  /**
   * GET /api/users/business
   * Get customer business details
   */
  @Get('business')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get business details',
    description: 'Retrieve customer business profile (customers only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Business details retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          businessName: 'Church Org',
          businessRegistrationNumber: 'TZ-BRN-2023-001234',
          country: 'Tanzania',
          region: 'Dar es Salaam',
          district: 'Kinondoni',
          street: 'Msimbazi Street, Plot 123',
          houseNumber: 'House 45A',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T12:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not a customer account',
    schema: {
      example: {
        success: false,
        message: 'Business details are only available for customer accounts',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business profile not found',
  })
  async getBusinessDetails(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const business = await this.usersService.getBusinessDetails(
      userId,
      userRole
    );

    return {
      success: true,
      data: business,
    };
  }

  /**
   * PATCH /api/users/business
   * Update customer business details
   */
  @Patch('business')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Update business details',
    description:
      'Update customer business profile information (customers only)',
  })
  @ApiBody({ type: UpdateBusinessDto })
  @ApiResponse({
    status: 200,
    description: 'Business details updated successfully',
    schema: {
      example: {
        success: true,
        business: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          businessName: 'Church Org',
          businessRegistrationNumber: 'TZ-BRN-2023-001234',
          country: 'Tanzania',
          region: 'Dar es Salaam',
          district: 'Kinondoni',
          street: 'Msimbazi Street, Plot 123',
          houseNumber: 'House 45A',
          updatedAt: '2024-01-16T14:00:00Z',
        },
        message: 'Business details updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or missing required fields',
    schema: {
      example: {
        success: false,
        message:
          'Business name and registration number are required to create a business profile',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not a customer account',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Business registration number already exists',
    schema: {
      example: {
        success: false,
        message: 'Business registration number already registered',
      },
    },
  })
  async updateBusinessDetails(
    @Request() req: any,
    @Body() updateBusinessDto: UpdateBusinessDto
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.usersService.updateBusinessDetails(
      userId,
      userRole,
      updateBusinessDto
    );

    this.logger.log(`User ${userId} updated business details`);

    return result;
  }

  /**
   * GET /api/users/settings
   * Get user settings and preferences
   */
  @Get('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user settings',
    description: 'Retrieve user preferences and notification settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          darkMode: false,
          pushNotifications: true,
          emailAlerts: true,
          smsNotifications: true,
          transactionNotifications: true,
          billPaymentReminders: true,
          preferredLanguage: 'EN',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-16T12:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getSettings(@Request() req: any) {
    const userId = req.user.id;
    const settings = await this.usersService.getSettings(userId);

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * PATCH /api/users/settings
   * Update user settings and preferences
   */
  @Patch('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user settings',
    description: 'Update user preferences and notification settings',
  })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      example: {
        success: true,
        settings: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          darkMode: true,
          pushNotifications: true,
          emailAlerts: false,
          smsNotifications: true,
          transactionNotifications: true,
          billPaymentReminders: true,
          preferredLanguage: 'SW',
          updatedAt: '2024-01-16T14:00:00Z',
        },
        message: 'Settings updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid data format',
    schema: {
      example: {
        success: false,
        message: 'Preferred language must be either EN or SW',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateSettings(
    @Request() req: any,
    @Body() updateSettingsDto: UpdateSettingsDto
  ) {
    const userId = req.user.id;
    const result = await this.usersService.updateSettings(
      userId,
      updateSettingsDto
    );

    this.logger.log(`User ${userId} updated settings`);

    return result;
  }

  /**
   * GET /api/users/account/summary
   * Get combined account summary (account + business + settings)
   */
  @Get('account/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get account summary',
    description:
      'Retrieve combined account details, business profile, and settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Account summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          account: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@church.org',
            phone: '+255712345678',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            dateOfBirth: '1990-05-15',
            tinNumber: 'TZ123456789',
            nidaNumber: '19900515123456789012',
            profilePictureUrl:
              'https://church-uploads.s3.amazonaws.com/profileImages/123_profile.jpg',
            preferredLanguage: 'EN',
            role: 'CUSTOMER',
            status: 'ACTIVE',
            isActive: true,
            isVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-16T12:30:00Z',
          },
          business: {
            id: '660e8400-e29b-41d4-a716-446655440000',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            businessName: 'Church Org',
            businessRegistrationNumber: 'TZ-BRN-2023-001234',
            country: 'Tanzania',
            region: 'Dar es Salaam',
            district: 'Kinondoni',
            street: 'Msimbazi Street, Plot 123',
            houseNumber: 'House 45A',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-16T12:30:00Z',
          },
          settings: {
            id: '770e8400-e29b-41d4-a716-446655440000',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            darkMode: false,
            pushNotifications: true,
            emailAlerts: true,
            smsNotifications: true,
            transactionNotifications: true,
            billPaymentReminders: true,
            preferredLanguage: 'EN',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-16T12:30:00Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getAccountSummary(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const summary = await this.usersService.getAccountSummary(userId, userRole);

    return {
      success: true,
      data: summary,
    };
  }
}
