import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { WalledGardenService } from './walled-garden.service';
import { CreateWalledGardenDeviceDto, UpdateWalledGardenDeviceDto } from './walled-garden.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities';

@Controller('v1/walled-garden')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WalledGardenController {
  constructor(private readonly walledGardenService: WalledGardenService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walledGardenService.findAll(
      tenant,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.walledGardenService.findOne(id, tenant);
  }

  @Post()
  create(
    @Body() dto: CreateWalledGardenDeviceDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.walledGardenService.create(dto, tenant);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWalledGardenDeviceDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.walledGardenService.update(id, dto, tenant);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.walledGardenService.remove(id, tenant);
  }
}
