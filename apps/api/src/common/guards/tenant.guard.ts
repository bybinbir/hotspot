import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant) {
      throw new ForbiddenException('Tenant bağlamı gereklidir');
    }

    // If user is authenticated, verify they belong to this tenant
    const user = request.user;
    if (user && user.tenantId && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Bu tenant\'a erişim yetkiniz yok');
    }

    return true;
  }
}
