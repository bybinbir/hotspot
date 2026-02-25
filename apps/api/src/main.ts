import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Handlebars template engine (captive portal)
  app.setBaseViewsDir(join(__dirname, 'modules', 'portal', 'views'));
  app.setViewEngine('hbs');

  // Global prefix for API routes (portal routes excluded)
  app.setGlobalPrefix('api', {
    exclude: ['portal/(.*)'],
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`Hotspot API running on port ${port}`);
}

bootstrap();
