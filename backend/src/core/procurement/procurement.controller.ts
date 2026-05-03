import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreateProcurementDto } from './procurement.dto';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  findAll() {
    return this.procurementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.procurementService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateProcurementDto) {
    return this.procurementService.create(createDto);
  }
}
