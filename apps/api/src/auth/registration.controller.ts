import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RegistrationService } from './registration.service';
import {
  RegisterStep1Dto,
  RegisterStep2Dto,
  RegisterStep3Dto,
  RegisterStep4Dto,
  RegisterStep5Dto,
  ResendOtpDto,
} from '../../../../packages/config/src/dtos/registration';

@ApiTags('Registration')
@Controller('auth/register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * STEP 1: Basic Information Registration
   * POST /auth/register/step-1
   * Body: { fullName, email OR phone, password }
   */
  @Public()
  @Post('step-1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Step 1: Register with basic information',
    description:
      'Start registration with full name, email or phone, and password. Returns userId for subsequent steps.',
  })
  @ApiBody({ type: RegisterStep1Dto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully, OTP sent to email/phone',
    schema: {
      example: {
        success: true,
        message: 'Registration initiated. Please verify your email/phone.',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          message: 'OTP sent successfully',
          nextStep: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
    schema: {
      example: {
        success: false,
        message: 'Email already registered',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
    schema: {
      example: {
        success: false,
        message: 'User with this email already exists',
      },
    },
  })
  async registerStep1(@Body() dto: RegisterStep1Dto) {
    return this.registrationService.registerStep1(dto);
  }

  /**
   * STEP 2: OTP Verification
   * POST /auth/register/step-2
   * Body: { userId, otp, email OR phone }
   */
  @Public()
  @Post('step-2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 2: Verify OTP code',
    description:
      'Verify the 6-digit OTP code sent to email/phone. Account is activated upon successful verification.',
  })
  @ApiBody({ type: RegisterStep2Dto })
  @ApiResponse({
    status: 200,
    description:
      'OTP verified successfully, account activated, tokens returned',
    schema: {
      example: {
        success: true,
        message: 'OTP verified successfully',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'john.doe@church.org',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            isVerified: true,
          },
          nextStep: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
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
        message: 'OTP verification failed',
      },
    },
  })
  async registerStep2(@Body() dto: RegisterStep2Dto) {
    return this.registrationService.registerStep2(dto);
  }

  /**
   * STEP 3: Additional Details
   * POST /auth/register/step-3
   * Body: { userId, email OR phone, dateOfBirth, tinNumber, nidaNumber }
   */
  @Public()
  @Post('step-3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 3: Add personal details',
    description:
      'Submit additional personal information including date of birth, TIN number, and NIDA number.',
  })
  @ApiBody({ type: RegisterStep3Dto })
  @ApiResponse({
    status: 200,
    description: 'Personal details saved successfully',
    schema: {
      example: {
        success: true,
        message: 'Personal details saved successfully',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          completed: true,
          nextStep: 4,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid data',
    schema: {
      example: {
        success: false,
        message: 'Invalid date of birth format',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
      },
    },
  })
  async registerStep3(@Body() dto: RegisterStep3Dto) {
    return this.registrationService.registerStep3(dto);
  }

  /**
   * STEP 4: Business Profile & Documents
   * POST /auth/register/step-4
   * Body (multipart/form-data): {
   *   userId,
   *   businessName,
   *   businessRegistrationNumber,
   *   documents[] (files)
   * }
   */
  @Public()
  @Post('step-4')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('documents', 10)) // Max 10 files
  @ApiOperation({
    summary: 'Step 4: Add business profile and documents',
    description:
      'Upload business information and required documents (business license, registration certificate). Supports up to 10 files.',
  })
  @ApiBody({
    type: RegisterStep4Dto,
    description: 'Business details and documents (multipart/form-data)',
  })
  @ApiResponse({
    status: 200,
    description: 'Business profile and documents uploaded successfully',
    schema: {
      example: {
        success: true,
        message: 'Business profile and documents saved successfully',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          businessName: 'Acme Corporation',
          documentsUploaded: 3,
          nextStep: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or no documents uploaded',
    schema: {
      example: {
        success: false,
        message:
          'At least one document is required (business license or registration certificate)',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
      },
    },
  })
  async registerStep4(
    @Body() dto: RegisterStep4Dto,
    @UploadedFiles() files: any[]
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one document is required (business license or registration certificate)'
      );
    }

    // Convert Multer files to UploadedDocumentDto format
    const uploadedFiles = files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      destination: file.destination,
      filename: file.filename,
      path: file.path,
      buffer: file.buffer,
    }));

    return this.registrationService.registerStep4(dto, uploadedFiles);
  }

  /**
   * STEP 5: Address Details
   * POST /auth/register/step-5
   * Body: { userId, country, region, district, street, houseNumber }
   */
  @Public()
  @Post('step-5')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Step 5: Add address details (Final step)',
    description:
      'Complete registration by providing address details. Registration is finalized upon successful submission.',
  })
  @ApiBody({ type: RegisterStep5Dto })
  @ApiResponse({
    status: 200,
    description:
      'Registration completed successfully (user already authenticated from Step 2)',
    schema: {
      example: {
        success: true,
        message:
          'Registration completed successfully! Your account is now fully activated.',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          registrationComplete: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid address data',
    schema: {
      example: {
        success: false,
        message: 'Invalid address details',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
      },
    },
  })
  async registerStep5(@Body() dto: RegisterStep5Dto) {
    return this.registrationService.registerStep5(dto);
  }

  /**
   * Get Registration Status
   * GET /auth/register/status/:userId
   * Returns current registration progress
   */
  @Public()
  @Get('status/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get registration progress status',
    description:
      'Check the current registration progress and completed steps for a user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration status retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Registration status retrieved',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          currentStep: 3,
          completedSteps: [1, 2],
          totalSteps: 5,
          isComplete: false,
          steps: {
            step1: { completed: true, name: 'Basic Information' },
            step2: { completed: true, name: 'OTP Verification' },
            step3: { completed: false, name: 'Additional Details' },
            step4: { completed: false, name: 'Business Profile' },
            step5: { completed: false, name: 'Address Details' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
      },
    },
  })
  async getRegistrationStatus(@Param('userId') userId: string) {
    return this.registrationService.getRegistrationStatus(userId);
  }

  /**
   * Resend OTP
   * POST /auth/register/resend-otp
   * Body: { userId, email OR phone, purpose }
   */
  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP code',
    description:
      'Request a new OTP code to be sent to email or phone. Previous OTP will be invalidated.',
  })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP sent successfully',
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          sentTo: 'john@example.com',
          expiresIn: '10 minutes',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or user not found',
    schema: {
      example: {
        success: false,
        message: 'User not found or invalid request',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      example: {
        success: false,
        message: 'Too many OTP requests. Please wait before requesting again.',
      },
    },
  })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.registrationService.resendOtp(dto);
  }
}
