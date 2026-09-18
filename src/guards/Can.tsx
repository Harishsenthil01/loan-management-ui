import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, type Permission } from './permissions';

export function usePermission() {
  const { user } = useAuth();
  return (permission: Permission) => hasPermission(user?.role, permission);
}

/**
 * Declarative permission gate for UI elements, e.g.:
 *   <Can do="customer:manage"><Button>Delete</Button></Can>
 */
export function Can({ do: permission, children }: { do: Permission; children: ReactNode }) {
  const can = usePermission();
  if (!can(permission)) return null;
  return <>{children}</>;
}
