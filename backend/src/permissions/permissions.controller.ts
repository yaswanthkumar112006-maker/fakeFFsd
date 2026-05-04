import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { PermissionsService } from './permissions.service';
import { UpdatePermissionsMatrixDto } from './dto/permissions-matrix.dto';

@ApiTags('permissionsMatrix')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('permissionsMatrix')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get the permissions matrix' })
  @ApiOkResponse({
    description: 'Current permissions matrix returned successfully.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
      example: {
        'Request Resources': ['Requestor', 'System Admin'],
        'Allocate Resources': ['Staff', 'System Admin'],
      },
    },
  })
  get(@Req() req: any) {
    return this.permissionsService.getMatrix(req.context);
  }

  @Post()
  @Roles('System Admin')
  @ApiBody({ type: UpdatePermissionsMatrixDto })
  @ApiOperation({ summary: 'Replace the permissions matrix' })
  @ApiOkResponse({
    description: 'Permissions matrix updated successfully.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  })
  update(@Body() body: UpdatePermissionsMatrixDto) {
    return this.permissionsService.updateMatrix(body.matrix);
  }

  @Post('reset')
  @Roles('System Admin')
  @ApiOperation({ summary: 'Reset permissions matrix to defaults' })
  @ApiOkResponse({
    description: 'Permissions matrix reset successfully.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  })
  reset() {
    return this.permissionsService.resetMatrix();
  }
}
