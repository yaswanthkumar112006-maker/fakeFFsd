import { Module } from '@nestjs/common';
import { ResourceTypesController } from './resource-types.controller';
import { ResourceTypesService } from './resource-types.service';
import { ResourceTypesRepo } from './resource-types.repo';

@Module({
  controllers: [ResourceTypesController],
  providers: [ResourceTypesService, ResourceTypesRepo],
  exports: [ResourceTypesService],
})
export class ResourceTypesModule {}
