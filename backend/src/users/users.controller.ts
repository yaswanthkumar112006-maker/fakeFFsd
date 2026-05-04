import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { UserResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('users')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users visible to the acting role' })
  @ApiOkResponse({ description: 'Users returned for the current actor scope.', type: UserResponseDto, isArray: true })
  getAll(@Req() req: any) {
    return this.usersService.getAll(req.context);
  }

  @Post()
  @Roles('System Admin')
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully.', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Only System Admin can create users.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('System Admin')
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', example: 'U201' })
  @ApiOkResponse({ description: 'User updated successfully.', type: UserResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('System Admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'id', example: 'U201' })
  @ApiOkResponse({ description: 'User deactivated successfully.', type: UserResponseDto })
  remove(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
