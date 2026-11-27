import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  ConfirmCodeDto,
  StartEmailVerificationDto,
  StartPhoneVerificationDto,
} from './dto/verification.dto';
import { VerificationService } from './verification.service';

@ApiTags('Contact verification')
@ApiBearerAuth('access-token')
@Controller('verification')
@UseGuards(JwtAuthGuard)
@RequirePermission('update:self')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('email/start')
  @HttpCode(HttpStatus.ACCEPTED)
  startEmail(@GetUser('id') userId: string, @Body() dto: StartEmailVerificationDto) {
    return this.verification.startEmail(userId, dto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  confirmEmail(@GetUser('id') userId: string, @Body() dto: ConfirmCodeDto) {
    return this.verification.confirmEmail(userId, dto.code);
  }

  @Post('phone/start')
  @HttpCode(HttpStatus.ACCEPTED)
  startPhone(@GetUser('id') userId: string, @Body() dto: StartPhoneVerificationDto) {
    return this.verification.startPhone(userId, dto.phone);
  }

  @Post('phone/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPhone(@GetUser('id') userId: string, @Body() dto: ConfirmCodeDto) {
    return this.verification.confirmPhone(userId, dto.code);
  }
}
