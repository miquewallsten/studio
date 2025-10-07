export type Role =
  | 'Super Admin' | 'Admin' | 'Manager' | 'Analyst' | 'View Only'
  | 'Tenant Admin' | 'Tenant User' | 'End User' | 'Unassigned';

export type Decoded = { uid: string; email?: string; role?: Role; tenantId?: string };

export type ToolContext = {
  user: Decoded;
  input: any;
  fetcher: typeof fetch;
};

export type Tool = {
  id: string;
  kind: 'query' | 'action';
  allow: (u: Decoded) => boolean;
  tenantAware?: boolean;
  parse?: (raw: any) => any;
  run: (ctx: ToolContext) => Promise<any>;
};
