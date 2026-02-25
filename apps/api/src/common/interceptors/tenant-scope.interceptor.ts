import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * TenantScopeInterceptor injects tenant_id into the request context.
 * Services should use the CurrentTenant decorator to access the tenant
 * and filter queries accordingly.
 *
 * This interceptor primarily ensures that any service creating new records
 * has access to the tenant context.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (tenant) {
      // Make tenant ID easily accessible in the request for services
      request.tenantId = tenant.id;
    }

    return next.handle();
  }
}
