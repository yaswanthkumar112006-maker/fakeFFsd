import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { createSwaggerDocument } from './common/swagger-document';
import { SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const document = createSwaggerDocument(app);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend'));

  const port = Number(process.env.PORT || '3000');
  await app.listen(port);
}

bootstrap();
