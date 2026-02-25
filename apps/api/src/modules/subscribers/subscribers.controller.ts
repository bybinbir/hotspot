import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto, UpdateSubscriberDto, ResetPasswordDto } from './subscribers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities';

@Controller('v1/subscribers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.subscribersService.findAll(
      tenant,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.subscribersService.findOne(id, tenant);
  }

  @Post()
  create(@Body() dto: CreateSubscriberDto, @CurrentTenant() tenant: Tenant) {
    return this.subscribersService.create(dto, tenant);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriberDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.subscribersService.update(id, dto, tenant);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.subscribersService.toggleStatus(id, tenant);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.subscribersService.resetPassword(id, dto.password, tenant);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.subscribersService.remove(id, tenant);
  }
}
