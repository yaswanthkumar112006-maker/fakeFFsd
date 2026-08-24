import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('ResourceX Demo Backend')
    .setDescription(
      'Demo-exact NestJS backend for the ResourceX frontend. All authorization is role-based through request headers. Use x-user-role on every protected route and x-user-id when actor-specific scoping is required.',
    )
    .setVersion('1.0.0')
    .addServer('/api', 'API base path')
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
