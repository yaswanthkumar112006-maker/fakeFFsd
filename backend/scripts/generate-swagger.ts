import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { createSwaggerDocument } from '../src/common/swagger-document';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const document = createSwaggerDocument(app);
  const docsDir = join(__dirname, '..', '..', 'docs');
  mkdirSync(docsDir, { recursive: true });

  writeFileSync(join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));
  await app.close();
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
