import type { Decoded, Tool } from './types';

export function canRun(tool: Tool, user: Decoded) {
  try { return tool.allow(user) === true; } catch { return false; }
}

export function mustTenant(u: Decoded) {
  if (!u.tenantId) throw new Error('TENANT_REQUIRED');
  return u.tenantId;
}

export function hasAnyRole(user: Decoded, roles: string[]) {
  return !!user.role && roles.includes(user.role);
}
