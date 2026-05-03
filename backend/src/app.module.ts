import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InMemoryModule } from './in-memory/in-memory.module';

// Core Feature Modules
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { DepartmentsModule } from './core/departments/departments.module';
import { ResourcesModule } from './core/resources/resources.module';
import { ResourceTypesModule } from './core/resource-types/resource-types.module';
import { RequestsModule } from './core/requests/requests.module';
import { AllocationsModule } from './core/allocations/allocations.module';
import { ProcurementModule } from './core/procurement/procurement.module';
import { ReturnsModule } from './core/returns/returns.module';
import { MaintenanceModule } from './core/maintenance/maintenance.module';
import { ScrapModule } from './core/scrap/scrap.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { ActivityModule } from './core/activity/activity.module';
import { RolesModule } from './core/roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InMemoryModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ResourcesModule,
    ResourceTypesModule,
    RequestsModule,
    AllocationsModule,
    ProcurementModule,
    ReturnsModule,
    MaintenanceModule,
    ScrapModule,
    NotificationsModule,
    ActivityModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
