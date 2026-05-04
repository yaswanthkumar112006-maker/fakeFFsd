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
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-role',
        in: 'header',
        description:
          'Required RBAC header. Example values: Requestor, Dept Head, Registrar, Staff, System Admin.',
      },
      'role-header',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-id',
        in: 'header',
        description:
          'Optional acting user id header for own-profile and department-scoped behavior. Example: U100.',
      },
      'user-id-header',
    )
    .build();
}

export function createSwaggerDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, buildSwaggerConfig());
}
