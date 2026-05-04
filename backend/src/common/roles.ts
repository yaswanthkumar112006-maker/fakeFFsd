export const ROLES = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Staff',
  'System Admin',
] as const;

export type Role = (typeof ROLES)[number];

export interface RequestContext {
  role: Role | 'Guest';
  userId?: string;
}
