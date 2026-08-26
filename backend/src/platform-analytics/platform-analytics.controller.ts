import { Controller, Get, UseFilters } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { Roles } from '../common/roles.decorator';
import { PlatformAnalyticsExceptionFilter } from './filters/platform-analytics-exception.filter';

@ApiTags('Platform Analytics')
@ApiBearerAuth()
@Controller('platform-analytics')
@UseFilters(PlatformAnalyticsExceptionFilter)
export class PlatformAnalyticsController {
  constructor(private readonly platformAnalyticsService: PlatformAnalyticsService) {}

  @Get()
  @Roles('Owner')
  @ApiOperation({ summary: 'Get platform wide analytics for Owner' })
  getAnalytics() {
    return this.platformAnalyticsService.getAnalytics();
  }
}
