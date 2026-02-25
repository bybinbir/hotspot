import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Tenant,
  AdminUser,
  PortalTheme,
  Package,
  SpeedPackageTemplate,
  CustomerCountTemplate,
  Subscriber,
  NasDevice,
  Voucher,
  Radacct,
} from '../../database/entities';
import { RadiusModule } from '../radius/radius.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      AdminUser,
      PortalTheme,
      Package,
      SpeedPackageTemplate,
      CustomerCountTemplate,
      Subscriber,
      NasDevice,
      Voucher,
      Radacct,
    ]),
    RadiusModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
