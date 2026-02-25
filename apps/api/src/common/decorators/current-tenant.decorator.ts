import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Tenant } from '../../database/entities';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Tenant | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant || null;
  },
);
