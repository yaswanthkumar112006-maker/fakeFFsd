import { BadRequestException } from '@nestjs/common';
import { RequestContext } from './roles';
import { DataService } from '../data/data.service';

export function getActingUser(dataService: DataService, context: RequestContext) {
  if (!context.userId) {
    return undefined;
  }
  return dataService.getUserById(context.userId);
}

export function ensureActor(dataService: DataService, context: RequestContext) {
  const user = getActingUser(dataService, context);
  if (!user) {
    throw new BadRequestException('A valid x-user-id header is required for this action.');
  }
  return user;
}

export function ensureDepartmentScoped(dataService: DataService, context: RequestContext, department?: string) {
  if (context.role !== 'Staff' && context.role !== 'Dept Head') {
    return;
  }
  const user = getActingUser(dataService, context);
  if (!user || user.department !== department) {
    throw new BadRequestException('Action is restricted to your department.');
  }
}

export function normalizeResourceToken(value?: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(v\d+|inch|inches|sets|set|bundles|bundle)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getResourceTypeAliases(resourceType: string): string[] {
  const normalized = normalizeResourceToken(resourceType);
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
    whiteboards: ['whiteboard', 'furniture'],
    hardware: ['hardware', 'server blade', 'router', 'switch'],
    appliance: ['appliance', 'coffee machine'],
    'walkie talkies': ['electronics', 'accessories', 'walkie talkie'],
    'microscope sets': ['microscope', 'electronics'],
  };

  const aliases = aliasMap[normalized] || [];
  return [...new Set([normalized, ...aliases].map((item) => normalizeResourceToken(item)).filter(Boolean))];
}

export function resourceMatchesType(resource: { type?: string; name?: string }, requestedType: string): boolean {
  const aliases = getResourceTypeAliases(requestedType);
  const resourceType = normalizeResourceToken(resource.type);
  const resourceName = normalizeResourceToken(resource.name);

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

export function getDepartmentResourceTypes(dataService: DataService, department: string, organizationId?: string): string[] {
  const entry = dataService.getResourceCatalog().find(
    (item) => item.department === department && (!organizationId || item.organizationId === organizationId)
  );
  return entry ? [...entry.resourceTypes] : [];
}

export function ensureValidDepartmentResourceType(dataService: DataService, department: string, resourceType: string, organizationId?: string) {
  const allowedTypes = getDepartmentResourceTypes(dataService, department, organizationId);
  if (allowedTypes.length === 0) {
    throw new BadRequestException(
      `Resource catalog configuration is missing for department "${department}". Please configure it before performing this action.`,
    );
  }

  const requestedAliases = getResourceTypeAliases(resourceType);
  const isValid = allowedTypes.some((allowed) => {
    const allowedAliases = getResourceTypeAliases(allowed);
    return allowedAliases.some((alias) => requestedAliases.includes(alias));
  });

  if (!isValid) {
    throw new BadRequestException(
      `Resource type "${resourceType}" is not configured for department "${department}".`,
    );
  }
}
