import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from '../../database/entities';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { RadiusModule } from '../radius/radius.module';

@Module({
  imports: [TypeOrmModule.forFeature([Package]), RadiusModule],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
