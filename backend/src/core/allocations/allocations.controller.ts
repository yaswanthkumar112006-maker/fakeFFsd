import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { CreateAllocationsDto } from './allocations.dto';

@Controller('allocations')
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Get()
  findAll() {
    return this.allocationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allocationsService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateAllocationsDto) {
    return this.allocationsService.create(createDto);
  }
}
