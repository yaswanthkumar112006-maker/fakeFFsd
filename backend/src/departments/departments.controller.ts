import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { DepartmentResponseDto, SuccessResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@ApiTags('departments')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiOkResponse({ description: 'Department list returned successfully.', type: DepartmentResponseDto, isArray: true })
  getAll(@Req() req: any) {
    return this.departmentsService.getAll(req.context);
  }

  @Post()
  @Roles('System Admin')
  @ApiBody({ type: CreateDepartmentDto })
  @ApiOperation({ summary: 'Create a department' })
  @ApiCreatedResponse({ description: 'Department created successfully.', type: DepartmentResponseDto })
  create(@Req() req: any, @Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(req.context, body);
  }

  @Patch(':id')
  @Roles('System Admin')
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', example: 'D1' })
  @ApiOkResponse({ description: 'Department updated successfully.', type: DepartmentResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('System Admin')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', example: 'D5' })
  @ApiOkResponse({ description: 'Department deleted successfully.', type: SuccessResponseDto })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
