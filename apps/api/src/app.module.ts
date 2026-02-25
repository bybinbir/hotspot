import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { PackagesModule } from './modules/packages/packages.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { RadiusModule } from './modules/radius/radius.module';
import { PortalModule } from './modules/portal/portal.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { SmsModule } from './modules/sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'hotspot'),
        password: config.get('DB_PASSWORD', 'hotspot_secret'),
        database: config.get('DB_DATABASE', 'hotspot'),
        entities: [__dirname + '/database/entities/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    TenantsModule,
    DevicesModule,
    SubscribersModule,
    PackagesModule,
    VouchersModule,
    RadiusModule,
    PortalModule,
    TemplatesModule,
    SmsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
