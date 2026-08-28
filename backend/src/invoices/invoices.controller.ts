import { Controller, Get, UseFilters } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { Roles } from '../common/roles.decorator';
import { InvoicesExceptionFilter } from './filters/invoices-exception.filter';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseFilters(InvoicesExceptionFilter)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('Owner', 'System Admin')
  @ApiOperation({ summary: 'Get all invoices' })
  getAll() {
    return this.invoicesService.getAll();
  }
}
