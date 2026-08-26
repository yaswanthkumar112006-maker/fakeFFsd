import { Controller, Get, Post, Patch, Body, Param, Req, UseFilters } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { Roles } from '../common/roles.decorator';
import { RequestContext } from '../common/roles';
import { CreateAnnouncementDto } from './dto/announcement.dto';
import { CommunicationsExceptionFilter } from './filters/communications-exception.filter';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseFilters(CommunicationsExceptionFilter)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements (scoped by role/org)' })
  getAll(@Req() req: any) {
    return this.announcementsService.getAll(req.context);
  }

  @Post()
  @Roles('Employee', 'Owner')
  @ApiOperation({ summary: 'Create an announcement (broadcast or single org)' })
  create(@Req() req: any, @Body() payload: CreateAnnouncementDto) {
    return this.announcementsService.create(req.context, payload);
  }

  @Patch(':id/reply')
  @Roles('System Admin')
  @ApiOperation({ summary: 'System Admin replies to an announcement' })
  reply(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reply: string },
  ) {
    return this.announcementsService.addReply(req.context, id, body.reply);
  }
}
