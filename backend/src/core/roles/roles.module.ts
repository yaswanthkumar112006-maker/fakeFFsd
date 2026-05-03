import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepo } from './roles.repo';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepo],
  exports: [RolesService],
})
export class RolesModule {}
