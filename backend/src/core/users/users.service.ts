import { Injectable } from '@nestjs/common';
import { UsersRepo } from './users.repo';
import { CreateUsersDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateUsersDto) {
    return this.repo.create(data);
  }
}
