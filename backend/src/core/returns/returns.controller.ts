import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnsDto } from './returns.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  findAll() {
    return this.returnsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnsService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateReturnsDto) {
    return this.returnsService.create(createDto);
  }
}
