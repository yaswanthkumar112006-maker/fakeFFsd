import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InMemoryStore implements OnModuleInit, OnModuleDestroy {
  private data: any = {};
  private readonly filePath = path.resolve(process.cwd(), 'data', 'mock-db.json');

  onModuleInit() {
    this.loadData();
  }

  onModuleDestroy() {
    this.saveData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('Mock DB loaded successfully.');
      } else {
        console.warn('Mock DB file not found. Creating a new one.');
        this.data = {};
        this.saveData();
      }
    } catch (error) {
      console.error('Failed to load Mock DB:', error);
      this.data = {};
    }
  }

  private saveData() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save Mock DB:', error);
    }
  }

  get(table: string): any[] {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    return this.data[table];
  }

  set(table: string, records: any[]) {
    this.data[table] = records;
    this.saveData(); // Save immediately on write for persistence during dev
  }

  // Generic helpers
  findAll(table: string): any[] {
    return this.get(table);
  }

  findOne(table: string, idField: string, idValue: any): any {
    return this.get(table).find((item) => item[idField] === idValue);
  }

  create(table: string, record: any): any {
    const records = this.get(table);
    records.push(record);
    this.set(table, records);
    return record;
  }

  update(table: string, idField: string, idValue: any, updateData: any): any {
    const records = this.get(table);
    const index = records.findIndex((item) => item[idField] === idValue);
    if (index > -1) {
      records[index] = { ...records[index], ...updateData };
      this.set(table, records);
      return records[index];
    }
    return null;
  }

  remove(table: string, idField: string, idValue: any): boolean {
    const records = this.get(table);
    const index = records.findIndex((item) => item[idField] === idValue);
    if (index > -1) {
      records.splice(index, 1);
      this.set(table, records);
      return true;
    }
    return false;
  }
}
