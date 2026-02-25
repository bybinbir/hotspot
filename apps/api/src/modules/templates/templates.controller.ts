import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import {
  CreateCustomerCountTemplateDto,
  UpdateCustomerCountTemplateDto,
  CreateSpeedPackageTemplateDto,
  UpdateSpeedPackageTemplateDto,
} from './templates.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../database/entities';

@Controller('admin/v1/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // ── Customer Count Templates ──────────────────────────────────────

  @Get('customer-count')
  findAllCustomerCount() {
    return this.templatesService.findAllCustomerCount();
  }

  @Get('customer-count/:id')
  findOneCustomerCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOneCustomerCount(id);
  }

  @Post('customer-count')
  createCustomerCount(@Body() dto: CreateCustomerCountTemplateDto) {
    return this.templatesService.createCustomerCount(dto);
  }

  @Put('customer-count/:id')
  updateCustomerCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerCountTemplateDto,
  ) {
    return this.templatesService.updateCustomerCount(id, dto);
  }

  @Delete('customer-count/:id')
  removeCustomerCount(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.removeCustomerCount(id);
  }

  // ── Speed Package Templates ───────────────────────────────────────

  @Get('speed-packages')
  findAllSpeedPackage() {
    return this.templatesService.findAllSpeedPackage();
  }

  @Get('speed-packages/:id')
  findOneSpeedPackage(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOneSpeedPackage(id);
  }

  @Post('speed-packages')
  createSpeedPackage(@Body() dto: CreateSpeedPackageTemplateDto) {
    return this.templatesService.createSpeedPackage(dto);
  }

  @Put('speed-packages/:id')
  updateSpeedPackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpeedPackageTemplateDto,
  ) {
    return this.templatesService.updateSpeedPackage(id, dto);
  }

  @Delete('speed-packages/:id')
  removeSpeedPackage(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.removeSpeedPackage(id);
  }
}
