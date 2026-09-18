import type { UserRole } from '@/models/user';

/**
 * Central permission catalogue. Add new capabilities here rather than
 * checking `role === 'ADMIN'` inline inside components/pages — that keeps
 * authorization logic in one reusable, testable place.
 */
export type Permission =
  | 'customer:manage' // create/edit/delete customers
  | 'customer:view-own'
  | 'loan:manage' // create/edit/delete any loan application
  | 'loan:create-own'
  | 'loan:view-own'
  | 'loan:update-status'
  | 'document:manage' // verify/reject/delete any document
  | 'document:upload';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'customer:manage',
    'customer:view-own',
    'loan:manage',
    'loan:create-own',
    'loan:view-own',
    'loan:update-status',
    'document:manage',
    'document:upload',
  ],
  USER: ['customer:view-own', 'loan:create-own', 'loan:view-own', 'document:upload'],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
