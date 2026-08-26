import { Controller, Get, Post, Body, Patch, Param, Req, UseFilters } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { Roles } from '../common/roles.decorator';
import { RequestContext } from '../common/roles';
import { CreateTicketDto, ResolveTicketDto } from './dto/support.dto';
import { SupportExceptionFilter } from './filters/support-exception.filter';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('support')
@UseFilters(SupportExceptionFilter)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets (scoped by role/org)' })
  getAll(@Req() req: any) {
    return this.supportService.getAll(req.context);
  }

  @Post()
  @Roles('System Admin', 'Dept Head')
  @ApiOperation({ summary: 'Create a new support ticket' })
  create(@Req() req: any, @Body() payload: CreateTicketDto) {
    return this.supportService.create(req.context, payload);
  }

  @Patch(':id/resolve')
  @Roles('Employee', 'Owner')
  @ApiOperation({ summary: 'Resolve or reply to a support ticket' })
  resolve(@Param('id') id: string, @Body() payload: ResolveTicketDto) {
    return this.supportService.resolve(id, payload);
  }
}
