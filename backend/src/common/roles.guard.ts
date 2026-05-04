import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RequestContext, ROLES, Role } from './roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const roleHeader = request.headers['x-user-role'];
    const normalizedRole = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    const role = ROLES.includes(normalizedRole as Role)
      ? (normalizedRole as Role)
      : 'Guest';

    request.context = {
      role,
      userId: Array.isArray(request.headers['x-user-id'])
        ? request.headers['x-user-id'][0]
        : request.headers['x-user-id'],
    } satisfies RequestContext;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(role as Role)) {
      throw new ForbiddenException('Role is not allowed for this action.');
    }

    return true;
  }
}
