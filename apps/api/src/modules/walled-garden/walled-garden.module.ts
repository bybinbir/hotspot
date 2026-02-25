import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalledGardenDevice, Radcheck } from '../../database/entities';
import { WalledGardenService } from './walled-garden.service';
import { WalledGardenController } from './walled-garden.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WalledGardenDevice, Radcheck])],
  controllers: [WalledGardenController],
  providers: [WalledGardenService],
  exports: [WalledGardenService],
})
export class WalledGardenModule {}
