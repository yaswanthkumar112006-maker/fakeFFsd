import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResourceTypesService } from './resource-types.service';
import { CreateResourceTypesDto } from './resource-types.dto';

@Controller('resource-types')
export class ResourceTypesController {
  constructor(private readonly resourceTypesService: ResourceTypesService) {}

  @Get()
  findAll() {
    return this.resourceTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceTypesService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateResourceTypesDto) {
    return this.resourceTypesService.create(createDto);
  }
}
