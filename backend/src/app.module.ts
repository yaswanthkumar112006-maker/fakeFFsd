import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DataModule } from './data/data.module';
import { RolesGuard } from './common/roles.guard';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RequestsModule } from './requests/requests.module';
import { ResourcesModule } from './resources/resources.module';
import { ProcurementsModule } from './procurements/procurements.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReturnsModule } from './returns/returns.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    DataModule,
    UsersModule,
    DepartmentsModule,
    PermissionsModule,
    RequestsModule,
    ResourcesModule,
    ProcurementsModule,
    MaintenanceModule,
    ReturnsModule,
    NotificationsModule,
    AnalyticsModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
