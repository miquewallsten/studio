
import { z } from "zod"

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
  createdAt: z.string(),
  userCount: z.number(),
  ticketsCreated: z.number(),
  url: z.string().optional().nullable(),
})

export type Tenant = z.infer<typeof tenantSchema>
