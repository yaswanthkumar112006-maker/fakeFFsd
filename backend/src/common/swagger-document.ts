import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('ResourceX Demo Backend')
    .setDescription(
      'Demo-exact NestJS backend for the ResourceX frontend. All authorization is role-based through JWT Bearer tokens. Log in via /api/auth/login to get your token and include it as a Bearer authorization header.',
    )
    .setVersion('1.0.0')
    .addServer('/', 'API base path')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
}

export function createSwaggerDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, buildSwaggerConfig());
}
