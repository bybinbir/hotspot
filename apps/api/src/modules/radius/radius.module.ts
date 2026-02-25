import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Radcheck,
  Radreply,
  RadGroupCheck,
  Radgroupreply,
  Radusergroup,
  Radacct,
  Radpostauth,
  NasDevice,
  Subscriber,
  Package,
} from '../../database/entities';
import { VendorAttributesService } from './vendor-attributes.service';
import { RadiusSyncService } from './radius-sync.service';
import { CoaService } from './coa.service';
import { AccountingService } from './accounting.service';
import { RadiusController } from './radius.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Radcheck,
      Radreply,
      RadGroupCheck,
      Radgroupreply,
      Radusergroup,
      Radacct,
      Radpostauth,
      NasDevice,
      Subscriber,
      Package,
    ]),
  ],
  controllers: [RadiusController],
  providers: [
    VendorAttributesService,
    RadiusSyncService,
    CoaService,
    AccountingService,
  ],
  exports: [
    VendorAttributesService,
    RadiusSyncService,
    CoaService,
    AccountingService,
  ],
})
export class RadiusModule {}
