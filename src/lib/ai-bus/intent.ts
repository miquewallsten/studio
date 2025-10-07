export function routeIntent(utterance: string) {
  const u = utterance.toLowerCase();

  // Queries
  if (/\b(usuarios|users|cuantos usuarios|how many users)\b/.test(u)) {
    return { toolId: 'count.users', args: {} };
  }
  if (/\b(tickets)\b/.test(u) && /\b(last|último|mes|month)\b/.test(u)) {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    return { toolId: 'count.ticketsSince', args: { since } };
  }
  if (/\b(cuantos|how many).*\btickets\b/.test(u)) {
    return { toolId: 'count.tickets', args: {} };
  }

  // Actions
  if (/create .*tenant|nuevo tenant|crear tenant/.test(u)) {
    const name = (u.match(/tenant (.+)$/)?.[1] || '').trim();
    return { toolId: 'create.tenant', args: { name } };
  }
  if (/create .*user|crear usuario/.test(u)) {
    const email = (u.match(/user ([^\s]+@[^\s]+)/)?.[1] || '').toLowerCase();
    return { toolId: 'create.user', args: { email } };
  }
  if (/add .*analyst/.test(u)) {
    const userId = (u.match(/analyst ([a-zA-Z0-9_-]+)/)?.[1] || '').trim();
    return { toolId: 'tenant.addAnalyst', args: { userId } };
  }

  return null;
}
