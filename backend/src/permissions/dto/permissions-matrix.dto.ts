import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsObject, IsString } from 'class-validator';
import { ROLES } from '../../common/roles';

export class PermissionRolesDto {
  @ApiProperty({ type: [String], enum: [...ROLES], example: ['Requestor', 'System Admin'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ROLES, { each: true })
  roles!: (typeof ROLES)[number][];
}

export class UpdatePermissionsMatrixDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string', enum: [...ROLES] },
    },
    example: {
      'Request Resources': ['Requestor', 'System Admin'],
      'Allocate Resources': ['Staff', 'System Admin'],
    },
  })
  @IsObject()
  matrix!: Record<string, (typeof ROLES)[number][]>;
}
