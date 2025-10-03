
export type Role = 'Super Admin' | 'Admin' | 'Manager' | 'Analyst' | 'View Only' | 'Tenant Admin' | 'Tenant User' | 'End User' | 'Unassigned';

const HIERARCHY: Role[] = [
    'Unassigned',
    'End User',
    'Tenant User',
    'View Only',
    'Analyst',
    'Manager',
    'Tenant Admin',
    'Admin',
    'Super Admin'
];

const RANK = new Map(HIERARCHY.map((r, i) => [r, i]));

/**
 * Checks if a user's role meets the minimum required role.
 * @param userRole The role of the user.
 * @param requiredRole The minimum role required for the action.
 * @returns True if the user has the required role or a higher one.
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const userRank = RANK.get(userRole) ?? -1;
  const requiredRank = RANK.get(requiredRole) ?? -1;
  return userRank >= requiredRank;
}

/**
 * Throws an error if the user's role does not meet the minimum requirement.
 * @param userRole The role of the user.
 * @param requiredRole The minimum role required.
 */
export function requireRole(userRole: Role, requiredRole: Role) {
  if (!hasRole(userRole, requiredRole)) {
    throw new Error(`Forbidden: requires role '${requiredRole}' or higher. User has role '${userRole}'.`);
  }
}
