import { Role } from './roles';

export const USER_STATUSES = ['Active', 'Inactive', 'Suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REQUEST_PRIORITIES = ['Low', 'Normal', 'High'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = [
  'Pending',
  'Approved',
  'Allocated',
  'Completed',
  'Rejected',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const RESOURCE_STATUSES = [
  'Available',
  'Allocated',
  'Maintenance Requested',
  'Maintenance',
  'Repaired',
  'Returned',
  'Scrapped',
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_CONDITIONS = [
  'New',
  'Good',
  'Average',
  'Fair',
  'Damaged',
  'Bad',
] as const;
export type ResourceCondition = (typeof RESOURCE_CONDITIONS)[number];

export const PROCUREMENT_STATUSES = [
  'Pending Approval',
  'Pending',
  'Approved',
  'Rejected',
  'Fulfilled',
  'Registered',
] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

export const MAINTENANCE_ACTION_STATUSES = ['Repaired', 'Scrap'] as const;
export type MaintenanceActionStatus = (typeof MAINTENANCE_ACTION_STATUSES)[number];

export type RecipientRole = Role | 'All';

export interface UserPreferences {
  notifications: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department?: string;
  status: UserStatus;
  preferences?: UserPreferences;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  head: string;
  memberCount: number;
}

export interface RequestRecord {
  id: string;
  resourceType: string;
  quantity: number;
  requestor: string;
  requestorId?: string;
  department: string;
  status: RequestStatus;
  priority?: RequestPriority;
  date: string;
  justification: string;
  assignedResources?: string;
  allocatedBy?: string;
}

export interface ResourceRecord {
  id: string;
  code?: string;
  internalId?: string;
  name?: string;
  type: string;
  department: string;
  serialNumber?: string;
  status: ResourceStatus;
  condition?: ResourceCondition;
  assignedTo?: string;
  assignedToId?: string;
  date?: string;
  vendor?: string;
  invoice?: string;
  location?: string;
  returnRequestedBy?: string;
  returnRequestedById?: string;
}

export interface ProcurementRegistrationResourceInput
  extends Omit<ResourceRecord, 'department'> {
  department?: string;
}

export interface ProcurementRecord {
  id: string;
  resourceType: string;
  item?: string;
  quantity: number;
  department: string;
  requestedBy?: string;
  requester?: string;
  requestedById?: string;
  status: ProcurementStatus;
  priority?: RequestPriority;
  date: string;
  justification: string;
  vendor?: string;
  invoice?: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  recipientRole: RecipientRole;
}

export interface MaintenanceHistoryRecord {
  code: string;
  type: string;
  allocatedTo?: string;
  issue: string;
  actionDate: string;
  status: MaintenanceActionStatus | 'Repaired';
  department: string;
}

export interface ReturnHistoryRecord {
  code: string;
  type: string;
  returnedBy: string;
  returnDate: string;
  processDate: string;
  condition: ResourceCondition | 'Bad';
  finalStatus: Extract<ResourceStatus, 'Available' | 'Scrapped'>;
  department: string;
}

export type PermissionsMatrixRecord = Record<string, Role[]>;

export interface StockThresholdRecord {
  id: string;
  department: string;
  resourceType: string;
  thresholdLevel: number;
}

export interface DepartmentResourceCatalogRecord {
  department: string;
  resourceTypes: string[];
}

export interface AppState {
  users: UserRecord[];
  departments: DepartmentRecord[];
  requests: RequestRecord[];
  resources: ResourceRecord[];
  procurements: ProcurementRecord[];
  notifications: NotificationRecord[];
  maintenanceHistory: MaintenanceHistoryRecord[];
  returnHistory: ReturnHistoryRecord[];
  permissionsMatrix: PermissionsMatrixRecord;
  stockThresholds: StockThresholdRecord[];
  resourceCatalog: DepartmentResourceCatalogRecord[];
}
