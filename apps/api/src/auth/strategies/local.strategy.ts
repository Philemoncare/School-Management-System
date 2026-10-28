import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(request: any, email: string, pass: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email, pass, {
        ip: request?.ip,
        userAgent: request?.headers?.['user-agent'],
        deviceId: request?.headers?.['x-device-id'],
      });
      if (!user) {
        request.authException = new UnauthorizedException('Invalid credentials');
        return null;
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        request.authException = error;
        return null;
      }
      throw error;
    }
  }
}
