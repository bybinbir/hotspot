import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './packages.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities';

@Controller('v1/packages')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.packagesService.findAll(tenant);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.packagesService.findOne(id, tenant);
  }

  @Post()
  create(@Body() dto: CreatePackageDto, @CurrentTenant() tenant: Tenant) {
    return this.packagesService.create(dto, tenant);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto, @CurrentTenant() tenant: Tenant) {
    return this.packagesService.update(id, dto, tenant);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.packagesService.remove(id, tenant);
  }
}
