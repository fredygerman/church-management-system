import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { AvatarUploadFile } from './users.service';
import { AVATAR_MAX_BYTES } from './avatar-image';
import { MULTIPART_LIMITS } from '../file-upload/file-upload.controller';
import { JwtAuthGuard, RoleGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '../auth/types/permission.types';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RoleType } from '../database/schema';

const AVATAR_UPLOAD_LIMITS = { ...MULTIPART_LIMITS, fileSize: AVATAR_MAX_BYTES };

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

    return this.usersService.toAccountView(account);
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
    status: 400,
    description: 'Email change requires verification (EMAIL_CHANGE_REQUIRES_VERIFICATION)',
  })
  async updateMe(
    @Request() req: any,
    @Body() dto: { name?: string; email?: string; picture?: string }
  ) {
    const userId = req.user.id;
    const result = await this.usersService.updateAccount(userId, dto);

    this.logger.log(`User ${userId} updated account details`);

    return { ...result, user: await this.usersService.toAccountView(result.user) };
  }

  /**
   * POST /api/users/me/avatar
   * Upload the current user's own photo (multipart field 'file': JPEG, PNG or WebP, max 5 MB)
   */
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: AVATAR_UPLOAD_LIMITS }))
  @RequirePermission('update:self')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload profile photo',
    description: 'Stores a private avatar after checking the file signature (JPEG, PNG, WebP)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar stored; returns a 15-minute signed avatarUrl' })
  @ApiResponse({ status: 400, description: 'AVATAR_MISSING_FILE, AVATAR_TOO_LARGE or AVATAR_TYPE_UNSUPPORTED' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file?: AvatarUploadFile,
  ) {
    const userId = req.user.id;
    const result = await this.usersService.uploadAvatar(userId, file);

    this.logger.log(`User ${userId} uploaded a profile photo`);

    return result;
  }

  /**
   * DELETE /api/users/me/avatar
   * Remove the current user's profile photo
   */
  @Delete('me/avatar')
  @RequirePermission('update:self')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove profile photo',
    description: 'Clears the avatar columns and deletes the stored object',
  })
  @ApiResponse({ status: 204, description: 'Avatar removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeAvatar(@Request() req: any): Promise<void> {
    const userId = req.user.id;
    await this.usersService.removeAvatar(userId);

    this.logger.log(`User ${userId} removed profile photo`);
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
   * PATCH /api/users/:userId/membership
   * Update a user's church-scoped membership role
   */
  @Patch(':userId/membership')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @RequirePermission('manage:users')
  @HttpCode(HttpStatus.OK)
  async updateMembershipRole(
    @Request() req: any,
    @Body() dto: { role: RoleType; reason?: string },
  ) {
    const updatedMembership = await this.usersService.updateMembershipRole(
      req.params.userId,
      req.user.churchId,
      dto.role,
      req.user.id,
      dto.reason,
    );

    this.logger.log(
      `User ${req.params.userId} membership role updated by ${req.user.id}`,
    );

    return {
      success: true,
      message: 'Membership role updated successfully',
      membership: updatedMembership,
    };
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
    await this.usersService.deleteUser(req.params.userId, req.user.churchId);

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
    const user = await this.usersService.restoreUser(req.params.userId, req.user.churchId);

    this.logger.log(`User restored by ${req.user.id}`);

    return {
      success: true,
      message: 'User restored successfully',
      data: user,
    };
  }
}
