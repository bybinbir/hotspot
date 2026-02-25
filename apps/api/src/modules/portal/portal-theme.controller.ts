import {
  Controller, Get, Put,
  Body, UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePortalThemeDto } from './portal-theme.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant, PortalTheme } from '../../database/entities';

@Controller('v1/portal-theme')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PortalThemeController {
  constructor(
    @InjectRepository(PortalTheme)
    private readonly portalThemeRepo: Repository<PortalTheme>,
  ) {}

  @Get()
  async get(@CurrentTenant() tenant: Tenant) {
    const theme = await this.portalThemeRepo.findOne({
      where: { tenantId: tenant.id },
    });

    if (!theme) {
      return this.portalThemeRepo.create({ tenantId: tenant.id });
    }

    return theme;
  }

  @Put()
  async update(
    @Body() dto: UpdatePortalThemeDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    let theme = await this.portalThemeRepo.findOne({
      where: { tenantId: tenant.id },
    });

    if (theme) {
      Object.assign(theme, dto);
    } else {
      theme = this.portalThemeRepo.create({ tenantId: tenant.id, ...dto });
    }

    return this.portalThemeRepo.save(theme);
  }
}
