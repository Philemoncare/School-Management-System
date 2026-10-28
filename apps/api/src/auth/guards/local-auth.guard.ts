import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req?.body) {
      if (!req.body.email && req.body.schoolLoginEmail) {
        req.body.email = req.body.schoolLoginEmail;
      }
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) throw err;
    if (!user) {
      const request = context.switchToHttp().getRequest();
      if (request?.authException) throw request.authException;
      throw new UnauthorizedException(info?.message || 'Invalid credentials');
    }
    return user;
  }
}
