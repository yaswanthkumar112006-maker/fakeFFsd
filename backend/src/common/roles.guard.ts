import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RequestContext, ROLES, Role } from './roles';

export function normalizeUserId(id?: string): string {
  if (!id) return '';
  const match = id.match(/^U-0*([1-9]\d*)$/i);
  return match ? `U${match[1]}` : id;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const role = request.context?.role || 'Guest';
    
    // We don't need to rebuild request.context here since AuthGuard already does it.

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    console.log(`RolesGuard: userRole="${role}", requiredRoles=${JSON.stringify(requiredRoles)}`);

    if (!requiredRoles.includes(role as Role)) {
      throw new ForbiddenException(`Role '${role}' is not allowed for this action. Allowed: ${requiredRoles}`);
    }

    return true;
  }
}
