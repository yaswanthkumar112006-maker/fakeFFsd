import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppState,
  DepartmentResourceCatalogRecord,
  DepartmentRecord,
  NotificationRecord,
  PermissionsMatrixRecord,
  ProcurementRegistrationResourceInput,
  ProcurementRecord,
  RequestRecord,
  ResourceCondition,
  ResourceRecord,
  StockThresholdRecord,
  UserRecord,
} from '../common/domain';
import { RequestContext } from '../common/roles';
import { seedState } from './seed';

@Injectable()
export class DataService {
  private readonly initialState: AppState = JSON.parse(JSON.stringify(seedState));
  private state: AppState = JSON.parse(JSON.stringify(seedState));

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  reset() {
    this.state = this.clone(this.initialState);
    return this.getState();
  }

  getState(): AppState {
    return this.clone(this.state);
  }

  getCollection(name: keyof AppState, context: RequestContext): AppState[keyof AppState] {
    switch (name) {
      case 'users':
        return this.listUsers(context);
      case 'departments':
        return this.clone(this.state.departments);
      case 'requests':
        return this.listRequests(context);
      case 'resources':
        return this.listResources(context);
      case 'procurements':
        return this.listProcurements(context);
      case 'notifications':
        return this.listNotifications(context);
      case 'maintenanceHistory':
        return this.listMaintenanceHistory(context);
      case 'returnHistory':
        return this.listReturnHistory(context);
      case 'permissionsMatrix':
        return this.clone(this.state.permissionsMatrix);
      case 'stockThresholds':
        return this.listStockThresholds(context);
      case 'resourceCatalog':
        return this.clone(this.state.resourceCatalog);
      default:
        throw new NotFoundException(`Collection ${String(name)} not found.`);
    }
  }

  getUserById(userId?: string): UserRecord | undefined {
    if (!userId) {
      return undefined;
    }
    return this.state.users.find((user) => user.id === userId);
  }

  getUserByEmail(email: string): UserRecord | undefined {
    return this.state.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  getActingUser(context: RequestContext): UserRecord | undefined {
    return this.getUserById(context.userId);
  }

  ensureActor(context: RequestContext): UserRecord {
    const user = this.getActingUser(context);
    if (!user) {
      throw new BadRequestException('A valid x-user-id header is required for this action.');
    }
    return user;
  }

  listUsers(context: RequestContext) {
    if (context.role === 'System Admin' || context.role === 'Guest') {
      return this.clone(this.state.users);
    }

    const user = this.getActingUser(context);
    if (!user) {
      return [];
    }
    return this.clone([user]);
  }

  listRequests(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.requests);
    }
    if (context.role === 'Dept Head' || context.role === 'Staff') {
      return this.clone(
        this.state.requests.filter((request) => request.department === user?.department),
      );
    }
    if (context.role === 'Requestor') {
      return this.clone(
        this.state.requests.filter(
          (request) =>
            request.requestorId === user?.id || request.requestor === user?.name,
        ),
      );
    }
    return [];
  }

  listResources(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.resources);
    }
    if (context.role === 'Dept Head' || context.role === 'Staff') {
      return this.clone(
        this.state.resources.filter((resource) => resource.department === user?.department),
      );
    }
    if (context.role === 'Requestor') {
      return this.clone(
        this.state.resources.filter(
          (resource) =>
            resource.assignedToId === user?.id || resource.assignedTo === user?.name,
        ),
      );
    }
    return [];
  }

  listProcurements(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.procurements);
    }
    if (context.role === 'Dept Head' || context.role === 'Staff') {
      return this.clone(
        this.state.procurements.filter((procurement) => procurement.department === user?.department),
      );
    }
    if (context.role === 'Requestor') {
      return this.clone(
        this.state.procurements.filter(
          (procurement) =>
            procurement.requestedById === user?.id ||
            procurement.requester === user?.name,
        ),
      );
    }
    return [];
  }

  listNotifications(context: RequestContext) {
    return this.clone(
      this.state.notifications.filter(
        (notification) =>
          notification.recipientRole === 'All' ||
          notification.recipientRole === context.role,
      ),
    );
  }

  listMaintenanceHistory(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.maintenanceHistory);
    }
    return this.clone(
      this.state.maintenanceHistory.filter(
        (item) =>
          item.department === user?.department ||
          item.allocatedTo === user?.name,
      ),
    );
  }

  listReturnHistory(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.returnHistory);
    }
    return this.clone(
      this.state.returnHistory.filter(
        (item) =>
          item.department === user?.department ||
          item.returnedBy === user?.name,
      ),
    );
  }

  listStockThresholds(context: RequestContext) {
    const user = this.getActingUser(context);
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return this.clone(this.state.stockThresholds);
    }
    return this.clone(
      this.state.stockThresholds.filter((item) => item.department === user?.department),
    );
  }

  listResourceCatalog(department?: string): DepartmentResourceCatalogRecord[] {
    const catalog = this.clone(this.state.resourceCatalog);
    if (!department || department === 'All') {
      return catalog;
    }
    return catalog.filter((item) => item.department === department);
  }

  getDepartmentResourceTypes(department: string): string[] {
    const entry = this.state.resourceCatalog.find((item) => item.department === department);
    return entry ? [...entry.resourceTypes] : [];
  }

  ensureValidDepartmentResourceType(department: string, resourceType: string) {
    const allowedTypes = this.getDepartmentResourceTypes(department);
    if (allowedTypes.length === 0) {
      return;
    }
    if (!allowedTypes.includes(resourceType)) {
      throw new BadRequestException(
        `Resource type "${resourceType}" is not configured for department "${department}".`,
      );
    }
  }

  updateUser(id: string, updates: Partial<UserRecord>) {
    const user = this.state.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    Object.assign(user, updates);
    return this.clone(user);
  }

  addUser(payload: UserRecord) {
    this.state.users.unshift(payload);
    return this.clone(payload);
  }

  addDepartment(payload: DepartmentRecord): DepartmentRecord {
    this.state.departments.unshift(payload);
    return this.clone(payload);
  }

  updateDepartment(id: string, updates: Partial<DepartmentRecord>): DepartmentRecord {
    const department = this.state.departments.find((item) => item.id === id);
    if (!department) {
      throw new NotFoundException('Department not found.');
    }
    Object.assign(department, updates);
    return this.clone(department);
  }

  deleteDepartment(id: string) {
    this.state.departments = this.state.departments.filter((item) => item.id !== id);
    return { success: true };
  }

  addRequest(payload: RequestRecord): RequestRecord {
    this.state.requests.unshift(payload);
    return this.clone(payload);
  }

  updateRequest(id: string, updates: Partial<RequestRecord>): RequestRecord {
    const request = this.state.requests.find((item) => item.id === id);
    if (!request) {
      throw new NotFoundException('Request not found.');
    }
    Object.assign(request, updates);
    return this.clone(request);
  }

  deleteRequest(id: string) {
    this.state.requests = this.state.requests.filter((item) => item.id !== id);
    return { success: true };
  }

  addResource(payload: ResourceRecord): ResourceRecord {
    this.state.resources.unshift(payload);
    return this.clone(payload);
  }

  updateResource(id: string, updates: Partial<ResourceRecord>): ResourceRecord {
    const resource = this.state.resources.find((item) => item.id === id);
    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }
    Object.assign(resource, updates);
    return this.clone(resource);
  }

  addProcurement(payload: ProcurementRecord): ProcurementRecord {
    this.state.procurements.unshift(payload);
    return this.clone(payload);
  }

  updateProcurement(id: string, updates: Partial<ProcurementRecord>): ProcurementRecord {
    const procurement = this.state.procurements.find((item) => item.id === id);
    if (!procurement) {
      throw new NotFoundException('Procurement not found.');
    }
    Object.assign(procurement, updates);
    return this.clone(procurement);
  }

  updatePermissions(matrix: PermissionsMatrixRecord): PermissionsMatrixRecord {
    this.state.permissionsMatrix = this.clone(matrix);
    return this.clone(this.state.permissionsMatrix);
  }

  resetPermissions() {
    this.state.permissionsMatrix = this.clone(this.initialState.permissionsMatrix);
    return this.clone(this.state.permissionsMatrix);
  }

  updateNotification(id: string, updates: Partial<NotificationRecord>): NotificationRecord {
    const notification = this.state.notifications.find((item) => item.id === id);
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    Object.assign(notification, updates);
    return this.clone(notification);
  }

  findRequest(id: string): RequestRecord {
    const request = this.state.requests.find((item) => item.id === id);
    if (!request) {
      throw new NotFoundException('Request not found.');
    }
    return request;
  }

  findResource(id: string): ResourceRecord {
    const resource = this.state.resources.find((item) => item.id === id);
    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }
    return resource;
  }

  findProcurement(id: string): ProcurementRecord {
    const procurement = this.state.procurements.find((item) => item.id === id);
    if (!procurement) {
      throw new NotFoundException('Procurement not found.');
    }
    return procurement;
  }

  ensureDepartmentScoped(context: RequestContext, department?: string) {
    if (context.role !== 'Staff' && context.role !== 'Dept Head') {
      return;
    }
    const user = this.getActingUser(context);
    if (!user || user.department !== department) {
      throw new BadRequestException('Action is restricted to your department.');
    }
  }

  private normalizeResourceToken(value?: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(v\d+|inch|inches|sets|set|bundles|bundle)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getResourceTypeAliases(resourceType: string): string[] {
    const normalized = this.normalizeResourceToken(resourceType);
    const aliasMap: Record<string, string[]> = {
      laptop: ['laptop', 'developer laptop', 'laptop bundle'],
      'developer laptops': ['laptop', 'developer laptop'],
      'laptop bundles': ['laptop', 'laptop bundle'],
      monitor: ['monitor', 'electronics'],
      projector: ['projector', 'electronics'],
      'projector screens': ['projector', 'electronics'],
      tablet: ['tablet', 'electronics'],
      printer: ['printer', 'electronics'],
      router: ['router', 'switch', 'network switch', 'hardware'],
      'cisco routers': ['router', 'switch', 'network switch', 'hardware'],
      'server blades': ['server blade', 'hardware'],
      'server blades v2': ['server blade', 'hardware'],
      accessories: ['accessories', 'keyboard', 'mouse', 'remote', 'headset'],
      'ergonomic keyboards': ['keyboard', 'accessories'],
      electronics: ['electronics', 'monitor', 'projector', 'tablet', 'printer'],
      furniture: ['furniture', 'desk', 'chair', 'table', 'whiteboard'],
      'standing desks': ['desk', 'furniture'],
      'office desks': ['desk', 'furniture'],
      'conference tables': ['table', 'furniture'],
      'whiteboards': ['whiteboard', 'furniture'],
      hardware: ['hardware', 'server blade', 'router', 'switch'],
      appliance: ['appliance', 'coffee machine'],
      'walkie talkies': ['electronics', 'accessories', 'walkie talkie'],
      'microscope sets': ['microscope', 'electronics'],
    };

    const aliases = aliasMap[normalized] || [];
    return [...new Set([normalized, ...aliases].map((item) => this.normalizeResourceToken(item)).filter(Boolean))];
  }

  resourceMatchesType(resource: ResourceRecord, requestedType: string): boolean {
    const aliases = this.getResourceTypeAliases(requestedType);
    const resourceType = this.normalizeResourceToken(resource.type);
    const resourceName = this.normalizeResourceToken(resource.name);

    return aliases.some((alias) => {
      return (
        resourceType === alias ||
        resourceName === alias ||
        resourceType.includes(alias) ||
        resourceName.includes(alias) ||
        alias.includes(resourceType) ||
        alias.includes(resourceName)
      );
    });
  }

  countAvailableResourcesByDepartmentType(department: string, resourceType: string): number {
    return this.state.resources.filter((resource) => {
      return (
        resource.department === department &&
        resource.status === 'Available' &&
        this.resourceMatchesType(resource, resourceType)
      );
    }).length;
  }

  allocateRequest(requestId: string, resourceIds: string[], context: RequestContext) {
    const request = this.findRequest(requestId);
    const user = this.ensureActor(context);

    if (context.role === 'Staff') {
      this.ensureDepartmentScoped(context, request.department);
    }

    if (request.status !== 'Approved') {
      throw new BadRequestException('Only approved requests can be allocated.');
    }

    if (resourceIds.length !== Number(request.quantity)) {
      throw new BadRequestException('Selected resources must match request quantity.');
    }

    const resources = resourceIds.map((resourceId) => this.findResource(resourceId));
    resources.forEach((resource) => {
      if (resource.department !== request.department) {
        throw new BadRequestException('Selected resources must be in the same department.');
      }
      if (resource.status !== 'Available') {
        throw new BadRequestException('Selected resources must be available.');
      }
      const typeMatch = this.resourceMatchesType(resource, request.resourceType);
      if (!typeMatch) {
        throw new BadRequestException('Selected resources do not match the request type.');
      }
      resource.status = 'Allocated';
      resource.assignedTo = request.requestor;
      resource.assignedToId = request.requestorId;
      resource.date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    });

    request.status = 'Allocated';
    request.assignedResources = resourceIds.join(', ');
    request.allocatedBy = user?.name || context.role;

    return this.clone(request);
  }

  confirmReceipt(requestId: string, context: RequestContext) {
    const request = this.findRequest(requestId);
    const user = this.ensureActor(context);
    if (request.status !== 'Allocated') {
      throw new BadRequestException('Only allocated requests can be confirmed.');
    }
    if (!user || request.requestorId !== user.id) {
      throw new BadRequestException('You can only confirm your own allocated requests.');
    }
    request.status = 'Completed';
    return this.clone(request);
  }

  requestMaintenance(resourceId: string, context: RequestContext) {
    const resource = this.findResource(resourceId);
    const user = this.ensureActor(context);
    if (resource.status !== 'Allocated' && resource.status !== 'Repaired') {
      throw new BadRequestException('Only allocated resources can enter maintenance.');
    }
    if (!user || resource.assignedToId !== user.id) {
      throw new BadRequestException('You can only request maintenance for your own resource.');
    }
    resource.status = 'Maintenance Requested';
    return this.clone(resource);
  }

  initiateReturn(resourceId: string, context: RequestContext) {
    const resource = this.findResource(resourceId);
    const user = this.ensureActor(context);
    if (resource.status !== 'Allocated' && resource.status !== 'Repaired') {
      throw new BadRequestException('Only allocated resources can be returned.');
    }
    if (!user || resource.assignedToId !== user.id) {
      throw new BadRequestException('You can only return your own resource.');
    }
    resource.status = 'Returned';
    resource.returnRequestedBy = user.name;
    resource.returnRequestedById = user.id;
    return this.clone(resource);
  }

  confirmRepairedAllocation(resourceId: string, context: RequestContext) {
    const resource = this.findResource(resourceId);
    const user = this.ensureActor(context);
    if (resource.status !== 'Repaired') {
      throw new BadRequestException('Only repaired resources can be confirmed.');
    }
    if (!user || resource.assignedToId !== user.id) {
      throw new BadRequestException('You can only confirm your own repaired resource.');
    }
    resource.status = 'Allocated';
    return this.clone(resource);
  }

  acceptMaintenance(resourceId: string, context: RequestContext) {
    const resource = this.findResource(resourceId);
    this.ensureDepartmentScoped(context, resource.department);
    if (resource.status !== 'Maintenance Requested') {
      throw new BadRequestException('Only maintenance-requested resources can be accepted.');
    }
    resource.status = 'Maintenance';
    return this.clone(resource);
  }

  resolveMaintenance(resourceId: string, status: 'Repaired' | 'Scrapped', context: RequestContext) {
    const resource = this.findResource(resourceId);
    this.ensureDepartmentScoped(context, resource.department);
    if (!['Maintenance Requested', 'Maintenance'].includes(resource.status)) {
      throw new BadRequestException('Only active maintenance items can be resolved.');
    }
    resource.status = status === 'Repaired' ? 'Repaired' : 'Scrapped';
    resource.condition = status === 'Repaired' ? 'Good' : resource.condition;
    this.state.maintenanceHistory.unshift({
      code: resource.id,
      type: resource.type,
      department: resource.department,
      allocatedTo: resource.assignedTo,
      issue: status === 'Repaired' ? 'Repaired' : 'Unrepairable',
      actionDate: new Date().toLocaleDateString(),
      status: status === 'Repaired' ? 'Repaired' : 'Scrap',
    });
    return this.clone(resource);
  }

  processReturn(resourceId: string, condition: ResourceCondition, context: RequestContext) {
    const resource = this.findResource(resourceId);
    this.ensureDepartmentScoped(context, resource.department);
    if (resource.status !== 'Returned') {
      throw new BadRequestException('Only returned resources can be processed.');
    }
    const finalStatus = condition === 'Bad' ? 'Scrapped' : 'Available';
    this.state.returnHistory.unshift({
      code: resource.id,
      type: resource.type,
      department: resource.department,
      returnedBy: resource.assignedTo || resource.returnRequestedBy || 'Unknown',
      returnDate: resource.date || new Date().toLocaleDateString(),
      processDate: new Date().toLocaleDateString(),
      condition,
      finalStatus,
    });
    resource.status = finalStatus;
    resource.condition = condition;
    resource.assignedTo = 'None';
    resource.assignedToId = undefined;
    resource.returnRequestedBy = undefined;
    resource.returnRequestedById = undefined;
    return this.clone(resource);
  }

  approveDeptProcurement(id: string, context: RequestContext) {
    const procurement = this.findProcurement(id);
    this.ensureDepartmentScoped(context, procurement.department);
    if (procurement.status !== 'Pending Approval') {
      throw new BadRequestException('Only requestor-submitted procurements can be department approved.');
    }
    procurement.status = 'Pending';
    return this.clone(procurement);
  }

  rejectDeptProcurement(id: string, context: RequestContext) {
    const procurement = this.findProcurement(id);
    this.ensureDepartmentScoped(context, procurement.department);
    if (procurement.status !== 'Pending Approval') {
      throw new BadRequestException('Only requestor-submitted procurements can be department rejected.');
    }
    procurement.status = 'Rejected';
    return this.clone(procurement);
  }

  approveRegistrarProcurement(id: string) {
    const procurement = this.findProcurement(id);
    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Only pending procurements can be registrar approved.');
    }
    procurement.status = 'Approved';
    return this.clone(procurement);
  }

  rejectRegistrarProcurement(id: string) {
    const procurement = this.findProcurement(id);
    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Only pending procurements can be registrar rejected.');
    }
    procurement.status = 'Rejected';
    return this.clone(procurement);
  }

  logPurchase(id: string, vendor: string, invoice: string, context: RequestContext) {
    const procurement = this.findProcurement(id);
    this.ensureDepartmentScoped(context, procurement.department);
    if (procurement.status !== 'Approved') {
      throw new BadRequestException('Only approved procurements can be logged.');
    }
    procurement.vendor = vendor;
    procurement.invoice = invoice;
    procurement.status = 'Fulfilled';
    return this.clone(procurement);
  }

  registerProcurement(id: string, resources: ProcurementRegistrationResourceInput[], context: RequestContext) {
    const procurement = this.findProcurement(id);
    this.ensureDepartmentScoped(context, procurement.department);
    if (procurement.status !== 'Fulfilled') {
      throw new BadRequestException('Only fulfilled procurements can be registered.');
    }
    if (resources.length === 0) {
      throw new BadRequestException('At least one resource must be registered.');
    }
    const existingSerials = new Set(
      this.state.resources.map((resource) =>
        String(resource.serialNumber || '').toLowerCase(),
      ),
    );
    for (const resource of resources) {
      const serial = String(resource.serialNumber || '').toLowerCase();
      if (!serial || existingSerials.has(serial)) {
        throw new BadRequestException('Serial numbers must be unique.');
      }
      existingSerials.add(serial);
      this.state.resources.unshift({
        ...resource,
        department: procurement.department,
        status: resource.status || 'Available',
        condition: resource.condition || 'New',
        assignedTo: resource.assignedTo || 'None',
      });
    }
    procurement.status = 'Registered';
    return this.clone(procurement);
  }

  updateStockThreshold(id: string, thresholdLevel: number, context: RequestContext) {
    const threshold = this.state.stockThresholds.find((item) => item.id === id);
    if (!threshold) {
      throw new NotFoundException('Threshold not found.');
    }
    this.ensureDepartmentScoped(context, threshold.department);
    threshold.thresholdLevel = thresholdLevel;
    return this.clone(threshold);
  }

  createOrUpdateStockThreshold(payload: StockThresholdRecord, context: RequestContext) {
    this.ensureDepartmentScoped(context, payload.department);
    const existing = this.state.stockThresholds.find(
      (item) =>
        item.department === payload.department &&
        item.resourceType === payload.resourceType,
    );
    if (existing) {
      existing.thresholdLevel = payload.thresholdLevel;
      return this.clone(existing);
    }
    this.state.stockThresholds.push(payload);
    return this.clone(payload);
  }
}
