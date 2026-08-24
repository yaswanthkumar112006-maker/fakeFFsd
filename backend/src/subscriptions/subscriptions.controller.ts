import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataService } from '../data/data.service';
import { Public } from '../auth/public.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly dataService: DataService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans (Public)' })
  getPlans() {
    return this.dataService.getSubscriptionPlans();
  }
}
