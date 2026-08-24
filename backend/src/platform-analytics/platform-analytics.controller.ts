import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { Roles } from '../common/roles.decorator';

@ApiTags('Platform Analytics')
@ApiBearerAuth()
@Controller('platform-analytics')
export class PlatformAnalyticsController {
  constructor(private readonly platformAnalyticsService: PlatformAnalyticsService) {}

  @Get()
  @Roles('Owner')
  @ApiOperation({ summary: 'Get platform wide analytics for Owner' })
  getAnalytics() {
    return this.platformAnalyticsService.getAnalytics();
  }
}
