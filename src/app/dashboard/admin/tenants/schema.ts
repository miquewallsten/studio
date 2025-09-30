
import { z } from "zod"

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  userCount: z.number(),
  ticketsCreated: z.number(),
})

export type Tenant = z.infer<typeof tenantSchema>
