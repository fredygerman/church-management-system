import {
  Controller,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { JwtAuthGuard } from './guards';
import { GetUser } from './decorators';

@ApiTags('Profile Management')
@Controller('auth/profile')
export class RegistrationController {
  private readonly logger = new Logger(RegistrationController.name);

  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * Update user profile after OAuth signup
   * PATCH /auth/profile
   */
  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Update user profile information (name, picture) after OAuth signup. Fields are optional.',
  })
  @ApiBody({
    schema: {
      example: {
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@church.org',
          picture: 'https://example.com/photo.jpg',
          role: 'member',
          churchId: null,
          assignedZoneId: null,
          isActive: true,
          createdAt: '2024-01-15',
          deletedAt: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async updateProfile(
    @GetUser() user: any,
    @Body()
    dto: {
      name?: string;
      picture?: string;
      phone?: string;
    }
  ) {
    const updatedUser = await this.registrationService.updateProfile(
      user.id,
      dto
    );

    this.logger.log(`Profile updated for user: ${user.id}`);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }
}
