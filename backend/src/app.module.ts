import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DataModule } from './data/data.module';
import { RolesGuard } from './common/roles.guard';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { RequestsModule } from './requests/requests.module';
import { ResourcesModule } from './resources/resources.module';
import { ProcurementsModule } from './procurements/procurements.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReturnsModule } from './returns/returns.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { ProfileModule } from './profile/profile.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SupportModule } from './support/support.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PlatformAnalyticsModule } from './platform-analytics/platform-analytics.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';


@Module({
  imports: [
    AuthModule,
    DataModule,
    UsersModule,
    OrganizationsModule,
    SupportModule,
    AnnouncementsModule,
    PlatformAnalyticsModule,
    InvoicesModule,
    SubscriptionsModule,
    DepartmentsModule,
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
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
