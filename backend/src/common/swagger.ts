import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './swagger-models';

export function ApiRoleHeaders() {
  return applyDecorators(
    ApiHeader({
      name: 'x-user-role',
      required: true,
      description:
        'Acting role for RBAC. Allowed values: Requestor, Dept Head, Registrar, Staff, System Admin.',
      example: 'Staff',
    }),
    ApiHeader({
      name: 'x-user-id',
      required: false,
      description:
        'Acting user id used for department scoping and own-record views. Example: U100.',
      example: 'U100',
    }),
    ApiSecurity('role-header'),
    ApiSecurity('user-id-header'),
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
