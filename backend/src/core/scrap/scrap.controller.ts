import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ScrapService } from './scrap.service';
import { CreateScrapDto } from './scrap.dto';

@Controller('scrap')
export class ScrapController {
  constructor(private readonly scrapService: ScrapService) {}

  @Get()
  findAll() {
    return this.scrapService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scrapService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateScrapDto) {
    return this.scrapService.create(createDto);
  }
}
