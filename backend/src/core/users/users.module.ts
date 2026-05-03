import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepo } from './users.repo';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepo],
  exports: [UsersService],
})
export class UsersModule {}
