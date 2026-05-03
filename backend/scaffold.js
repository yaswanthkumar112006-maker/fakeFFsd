const fs = require('fs');
const path = require('path');

const modules = [
  'auth', 'users', 'departments', 'resources', 'resource-types',
  'requests', 'allocations', 'procurement', 'returns',
  'maintenance', 'scrap', 'notifications', 'activity', 'roles'
];

const basePath = path.join(__dirname, 'src', 'core');

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

const toPascalCase = (str) => {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

modules.forEach(mod => {
  const modPath = path.join(basePath, mod);
  if (!fs.existsSync(modPath)) {
    fs.mkdirSync(modPath);
  }

  const pascalName = toPascalCase(mod);

  // module
  fs.writeFileSync(path.join(modPath, `${mod}.module.ts`), `import { Module } from '@nestjs/common';
import { ${pascalName}Controller } from './${mod}.controller';
import { ${pascalName}Service } from './${mod}.service';
import { ${pascalName}Repo } from './${mod}.repo';

@Module({
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service, ${pascalName}Repo],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`);

  // controller
  fs.writeFileSync(path.join(modPath, `${mod}.controller.ts`), `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ${pascalName}Service } from './${mod}.service';
import { Create${pascalName}Dto } from './${mod}.dto';

@Controller('${mod}')
export class ${pascalName}Controller {
  constructor(private readonly ${toCamelCase(mod)}Service: ${pascalName}Service) {}

  @Get()
  findAll() {
    return this.${toCamelCase(mod)}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${toCamelCase(mod)}Service.findOne(+id);
  }

  @Post()
  create(@Body() createDto: Create${pascalName}Dto) {
    return this.${toCamelCase(mod)}Service.create(createDto);
  }
}
`);

  // service
  fs.writeFileSync(path.join(modPath, `${mod}.service.ts`), `import { Injectable } from '@nestjs/common';
import { ${pascalName}Repo } from './${mod}.repo';
import { Create${pascalName}Dto } from './${mod}.dto';

@Injectable()
export class ${pascalName}Service {
  constructor(private readonly repo: ${pascalName}Repo) {}

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  create(data: Create${pascalName}Dto) {
    return this.repo.create(data);
  }
}
`);

  // repo
  // We need to map the module name to the correct table name from the mock db.
  let tableName = mod.replace('-', '_');
  if (mod === 'resource-types') tableName = 'resource_types';
  if (mod === 'requests') tableName = 'requests'; // etc... most map directly or closely.
  
  // Custom mapping for mock db
  const tableMap = {
    auth: 'users',
    users: 'users',
    departments: 'departments',
    resources: 'resources',
    'resource-types': 'resource_types',
    requests: 'requests',
    allocations: 'allocations',
    procurement: 'procurement_requests', // simplified
    returns: 'return_requests',
    maintenance: 'maintenance_requests',
    scrap: 'scrap_resources',
    notifications: 'notifications',
    activity: 'activity_history',
    roles: 'roles'
  };

  const actualTable = tableMap[mod] || tableName;

  fs.writeFileSync(path.join(modPath, `${mod}.repo.ts`), `import { Injectable } from '@nestjs/common';
import { InMemoryStore } from '../../in-memory/in-memory.store';

@Injectable()
export class ${pascalName}Repo {
  constructor(private readonly store: InMemoryStore) {}

  findAll() {
    return this.store.findAll('${actualTable}');
  }

  findOne(id: number) {
    // Assuming generic id field for now, normally it's mod_id
    return this.store.findOne('${actualTable}', 'id', id);
  }

  create(data: any) {
    return this.store.create('${actualTable}', data);
  }
}
`);

  // dto
  fs.writeFileSync(path.join(modPath, `${mod}.dto.ts`), `export class Create${pascalName}Dto {
  // Add validation fields here
}
`);

  // special case for auth guard
  if (mod === 'auth') {
    fs.writeFileSync(path.join(modPath, `${mod}.guard.ts`), `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
`);
  }
});

console.log('Successfully scaffolded all core modules.');
