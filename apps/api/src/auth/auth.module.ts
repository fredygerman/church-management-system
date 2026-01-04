import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { JwtStrategy, LocalStrategy, JwtRefreshStrategy } from './strategies';
import { JwtAuthGuard } from './guards';
import config from '../config';

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    SmsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.jwt.secret,
      signOptions: {
        expiresIn: config.jwt.accessTokenExpiresIn as any,
      },
    }),
  ],
  controllers: [AuthController, RegistrationController],
  providers: [
    AuthService,
    RegistrationService,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, RegistrationService, JwtAuthGuard],
})
export class AuthModule {}
