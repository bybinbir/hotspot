import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from '../../database/entities';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { RadiusModule } from '../radius/radius.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber]), RadiusModule],
  controllers: [SubscribersController],
  providers: [SubscribersService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
