import {
  Controller,
  Get,
  Patch,
  Delete,
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
import { UserRole } from '../auth/types/permission.types';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('User Account Management')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/me
   * Get current user's account details
   */
  @Get('me')
  @RequirePermission('read:self')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve current user account information',
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
          name: 'John Doe',
          picture: 'https://church-uploads.s3.amazonaws.com/profile.jpg',
          role: 'member',
          churchId: '660e8400-e29b-41d4-a716-446655440000',
          assignedZoneId: '770e8400-e29b-41d4-a716-446655440000',
          isActive: true,
          createdAt: '2024-01-15',
          deletedAt: null,
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
  async getMe(@Request() req: any) {
    const userId = req.user.id;
    const account = await this.usersService.getAccount(userId);

    return account;
  }

  /**
   * PATCH /api/users/me
   * Update current user's account details
   */
  @Patch('me')
  @RequirePermission('update:self')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user',
    description: 'Update user personal information (name, email, picture)',
  })
  @ApiBody({
    schema: {
      example: {
        name: 'John Updated',
        email: 'john.new@church.org',
        picture: 'https://church-uploads.s3.amazonaws.com/new.jpg',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  async updateMe(
    @Request() req: any,
    @Body() dto: { name?: string; email?: string; picture?: string }
  ) {
    const userId = req.user.id;
    const result = await this.usersService.updateAccount(userId, dto);

    this.logger.log(`User ${userId} updated account details`);

    return result;
  }

  /**
   * GET /api/users/:churchId
   * List users for a church
   */
  @Get()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @RequirePermission('view:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List church users',
    description: 'List all users in a church (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async listUsers(@Request() req: any) {
    const churchId = req.user.churchId;
    const role = req.query.role;
    const zoneId = req.query.zoneId;
    const limit = parseInt(req.query.limit || '20');
    const offset = parseInt(req.query.offset || '0');

    const result = await this.usersService.listUsers(churchId, {
      role,
      zoneId,
      limit,
      offset,
    });

    return result;
  }

  /**
   * DELETE /api/users/:userId
   * Soft delete a user
   */
  @Delete(':userId')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermission('manage:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete a user (cannot be undone)',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Request() req: any) {
    await this.usersService.deleteUser(req.params.userId);

    this.logger.log(`User deleted by ${req.user.id}`);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  /**
   * PATCH /api/users/:userId/restore
   * Restore a soft deleted user
   */
  @Patch(':userId/restore')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermission('manage:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore user',
    description: 'Restore a soft deleted user',
  })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async restoreUser(@Request() req: any) {
    const user = await this.usersService.restoreUser(req.params.userId);

    this.logger.log(`User restored by ${req.user.id}`);

    return {
      success: true,
      message: 'User restored successfully',
      data: user,
    };
  }
}
