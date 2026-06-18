// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'user', // Donor / public user
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Usage: @Roles(Role.ADMIN, Role.SUPER_ADMIN)