import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalTheme, Subscriber, Voucher, Package, Radacct } from '../../database/entities';
import { PortalController } from './portal.controller';
import { PortalThemeController } from './portal-theme.controller';
import { PortalService } from './portal.service';
import { RadiusModule } from '../radius/radius.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalTheme, Subscriber, Voucher, Package, Radacct]),
    RadiusModule,
    SmsModule,
  ],
  controllers: [PortalController, PortalThemeController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
