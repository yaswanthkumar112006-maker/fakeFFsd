import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './swagger-models';

export function ApiRoleHeaders() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
  );
}

export function ApiStandardErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Validation error or invalid workflow transition.',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Role or department scope does not allow this action.',
      type: ErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Requested entity was not found.',
      type: ErrorResponseDto,
    }),
  );
}
