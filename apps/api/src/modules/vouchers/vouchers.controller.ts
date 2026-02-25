import {
  Controller, Get, Post, Delete,
  Body, Param, Query, Res, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { VouchersService } from './vouchers.service';
import { GenerateVouchersDto } from './vouchers.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities';

@Controller('v1/vouchers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('packageId') packageId?: string,
  ) {
    return this.vouchersService.findAll(
      tenant,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      packageId,
    );
  }

  @Post('generate')
  generate(@Body() dto: GenerateVouchersDto, @CurrentTenant() tenant: Tenant) {
    return this.vouchersService.generate(dto, tenant);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.vouchersService.findOne(id, tenant);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenant: Tenant) {
    return this.vouchersService.remove(id, tenant);
  }

  @Post('export')
  async exportCsv(
    @CurrentTenant() tenant: Tenant,
    @Query('batchId') batchId: string,
    @Res() res: Response,
  ) {
    const csv = await this.vouchersService.exportCsv(tenant, batchId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vouchers.csv');
    res.send(csv);
  }
}
