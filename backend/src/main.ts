import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './app.config';
import { corsConfig } from './cors.config';
import { ValidationPipe } from '@nestjs/common';
import { InMemoryStore } from './in-memory/in-memory.store';
import { seedDatabase } from './in-memory/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix(appConfig.globalPrefix);
  app.enableCors(corsConfig);
  
  // We'll add the global validation pipe later after creating the shared/pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const store = app.get(InMemoryStore);
  await seedDatabase(store);

  await app.listen(appConfig.port);
  console.log(`Application is running on: http://localhost:${appConfig.port}/${appConfig.globalPrefix}`);
}
bootstrap();
