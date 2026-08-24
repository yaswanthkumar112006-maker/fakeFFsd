import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { Roles } from '../common/roles.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('Owner', 'System Admin')
  @ApiOperation({ summary: 'Get all invoices' })
  getAll() {
    return this.invoicesService.getAll();
  }
}
