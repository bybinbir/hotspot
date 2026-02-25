import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { Tenant, TenantStatus } from '../../database/entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const baseDomain = this.configService.get('BASE_DOMAIN', 'onspot.com.tr');

    // Extract slug from host
    // Handles: baharhotel.onspot.com.tr, portal.baharhotel.onspot.com.tr
    const slug = this.extractSlug(host, baseDomain);

    if (!slug) {
      // No tenant context (super admin, direct API access)
      next();
      return;
    }

    // Also check X-Tenant-Slug header (set by Nginx for portal routes)
    const headerSlug = req.headers['x-tenant-slug'] as string;
    const effectiveSlug = headerSlug || slug;

    if (effectiveSlug === 'admin' || effectiveSlug === 'api') {
      next();
      return;
    }

    const tenant = await this.tenantRepository.findOne({
      where: { slug: effectiveSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant bulunamadı');
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new NotFoundException('Bu hesap askıya alınmıştır');
    }

    (req as any).tenant = tenant;
    next();
  }

  private extractSlug(host: string, baseDomain: string): string | null {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];

    if (!hostWithoutPort.endsWith(baseDomain)) {
      return null;
    }

    const subdomain = hostWithoutPort.replace(`.${baseDomain}`, '');

    if (!subdomain || subdomain === hostWithoutPort) {
      return null;
    }

    // Handle portal.slug.onspot.com.tr -> extract "slug"
    if (subdomain.startsWith('portal.')) {
      return subdomain.replace('portal.', '');
    }

    return subdomain;
  }
}
