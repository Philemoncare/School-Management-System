import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'requiredFeature';
export const RequiredFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const schoolId = request.schoolId; // Assumes TenantGuard has run

    if (!schoolId) {
      // If it's a global operation, we might skip or handle differently
      return true;
    }

    const hasAccess = await this.subService.checkFeature(schoolId, requiredFeature);

    if (!hasAccess) {
      throw new ForbiddenException(`Your current subscription does not include access to the ${requiredFeature} feature.`);
    }

    return true;
  }
}
