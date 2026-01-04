import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'identifier', // Can be email or phone
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    identifier: string,
    password: string,
  ): Promise<any> {
    // Extract email or phone from request body
    const { email, phone } = req.body;

    const user = await this.authService.validateUser(
      email,
      phone,
      password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
