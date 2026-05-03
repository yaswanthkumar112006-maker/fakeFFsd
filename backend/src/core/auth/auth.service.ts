import { Injectable } from '@nestjs/common';
import { AuthRepo } from './auth.repo';
import { CreateAuthDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly repo: AuthRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateAuthDto) {
    return this.repo.create(data);
  }
}
