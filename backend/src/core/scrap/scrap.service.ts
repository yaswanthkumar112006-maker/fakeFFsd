import { Injectable } from '@nestjs/common';
import { ScrapRepo } from './scrap.repo';
import { CreateScrapDto } from './scrap.dto';

@Injectable()
export class ScrapService {
  constructor(private readonly repo: ScrapRepo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: CreateScrapDto) {
    return this.repo.create(data);
  }
}
