export type Role = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';

export function hasRole(userRole: Role, required: Role | Role[]) {
  const set = Array.isArray(required) ? required : [required];
  const order: Role[] = ['viewer','agent','manager','admin','owner'];
  const rank = (r: Role) => order.indexOf(r);
  return set.some(r => rank(userRole) >= rank(r));
}

export function requireRole(userRole: Role, required: Role | Role[]) {
  if (!hasRole(userRole, required)) throw new Error(`Forbidden: requires role ${Array.isArray(required)?required.join('|'):required}`);
}

export function requireTenantMatch(resourceTenantId: string, userTenantId: string) {
  if (resourceTenantId !== userTenantId) throw new Error('Forbidden: tenant mismatch');
}
